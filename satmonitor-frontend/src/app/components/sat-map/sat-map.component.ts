import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { defaults as defaultControls } from 'ol/control';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import XYZ from 'ol/source/XYZ';
import { unByKey } from 'ol/Observable';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import type { EventsKey } from 'ol/events';
import { environment } from 'src/environments/environments';
import {
  type Catalog,
  type Phenomenon,
  type Product,
  getCompareProducts,
  getPhenomena,
  getProducts,
  resolveRenderableLayers,
} from 'src/domain/catalog/adapter';

type SatmonitorLayerStyle = string;

type LayerSlot = 't1' | 't2' | 'delta' | 'final';

interface SatmonitorWmsLayerOption {
  id: string;
  label: string;
  productId: string;
  productLabel: string;
  slot: LayerSlot;
  kind: Product['kind'];
  layerName: string;
  styleName: SatmonitorLayerStyle;
  legend?: Product['legend'];
  bboxWgs84?: [number, number, number, number] | null;
}

interface CompareProductOption {
  id: string;
  label: string;
  productId: string;
  kind: Product['kind'];
  leftLayerName: string;
  rightLayerName: string;
  styleName: SatmonitorLayerStyle;
  legend?: Product['legend'];
  bboxWgs84?: [number, number, number, number] | null;
}

interface IndicatorInfo {
  name: string;
  measure: string;
  typicalRange: string;
  quickRead: string[];
}

interface DateLabels {
  date1Label: string;
  date2Label?: string;
  metadataStatus?: 'ok' | 'missing';
  warning?: string;
}

export type BasemapKind = 'OSM' | 'XYZ';

export interface BasemapItem {
  id: string;
  label: string;
  desc?: string;
  thumb: string;
  kind: BasemapKind;
  url?: string;
}



@Component({
  selector: 'app-sat-map',
  templateUrl: './sat-map.component.html',
  styleUrls: ['./sat-map.component.css']
})
export class SatMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private readonly fallbackCenterLonLat: [number, number] = [-17.44406, 14.6937];
  private readonly fallbackZoom = 11;
  private geoserverWorkspace = environment.geoserverWorkspace || 'satmonitor';
  private phenomenonId = '';

  private get wmsUrl(): string {
    return `${environment.geoserverBase}/${this.geoserverWorkspace}/wms`;
  }

  private map?: OlMap;
  private baseLayer?: TileLayer<OSM | XYZ>;

  get getMap(): OlMap | undefined {
    return this.map;
  }

  get getAvailableLayers(): SatmonitorWmsLayerOption[] {
    return this.availableLayers;
  }

  get getCompareOptions(): Array<{ id: string; label: string }> {
    return this.compareOptions.map((opt) => ({ id: opt.id, label: opt.label }));
  }

  get getSelectedLayerId(): string {
    return this.selectedLayerId;
  }

  set setSelectedLayerId(id: string) {
    this.selectedLayerId = id;
    this.onLayerChange();
  }

  get getWmsVisible(): boolean {
    return this.wmsVisible;
  }

  set setWmsVisible(visible: boolean) {
    this.wmsVisible = visible;
    this.onOverlayToggle();
  }

  get getWmsOpacity(): number {
    return this.wmsOpacity;
  }

  set setWmsOpacity(opacity: number) {
    this.wmsOpacity = Math.max(0.6, Math.min(0.9, opacity));
    this.onOpacityChange();
  }

  get getCompareEnabled(): boolean {
    return this.compareEnabled;
  }

  set setCompareEnabled(enabled: boolean) {
    this.compareEnabled = enabled;
    this.onCompareToggle();
  }

  get getCompareIndex(): string {
    return this.compareIndex;
  }

  set setCompareIndex(index: string) {
    this.compareIndex = index;
    this.onCompareIndexChange();
  }

  get getSelectedIndicatorInfo(): IndicatorInfo {
    return this.selectedIndicatorInfo;
  }

  get getDateLabels(): DateLabels {
    return this.dateLabels;
  }

  get getMetadataStatus(): 'ok' | 'missing' {
    return this.metadataStatus;
  }

  get getLegendMetadata(): Product['legend'] | undefined {
    return this.legendMetadata;
  }

  get getLegendUrl(): string {
    return this.legendUrl;
  }

  get getLegendExpanded(): boolean {
    return this.legendExpanded;
  }

  get getLastFeatureInfo(): string | undefined {
    return this.lastFeatureInfo;
  }

  setCatalog(catalog: Catalog): void {
    this.catalog = catalog ?? { version: '1.0', phenomena: [] };
    this.phenomenonId = this.resolvePhenomenonId(this.phenomenonId);
    this.updateTemporalMetadata(undefined);
    this.capabilitiesDocPromise = undefined;
    this.capabilitiesDocFetchedAt = 0;
    this.capabilityLayerNames.clear();
    this.hasCapabilities = false;
    this.rebuildCatalogDrivenState({ resetSelection: true, updateMap: true });
    void this.syncLayersFromCapabilities({ updateMap: true });
  }

  setPhenomenon(phenomenonId: string): void {
    this.phenomenonId = this.resolvePhenomenonId(phenomenonId);
    this.updateTemporalMetadata(undefined);
    this.rebuildCatalogDrivenState({ resetSelection: true, updateMap: true });
    void this.syncLayersFromCapabilities({ updateMap: true });
  }

  applyTraitementContext(ctx: {
    run_id: string;
    phenomenon?: string;
    date_1?: string | null;
    date_2?: string | null;
    datetime_1?: string | null;
    datetime_2?: string | null;
    metadata_status?: 'ok' | 'missing' | null;
    metadata_reason?: string | null;
    catalog?: unknown;
  }): void {
    if (ctx?.phenomenon) {
      this.phenomenonId = this.resolvePhenomenonId(ctx.phenomenon);
    }
    this.updateTemporalMetadata(ctx);
    this.rebuildCatalogDrivenState({ resetSelection: false, updateMap: true });
    void this.syncLayersFromCapabilities({ updateMap: true });
  }

  getViewportAoiGeoJson(): any | null {
    const map = this.map;
    if (!map) return null;
    const size = map.getSize();
    if (!size) return null;

    const extent = map.getView().calculateExtent(size);
    const min = toLonLat([extent[0], extent[1]]);
    const max = toLonLat([extent[2], extent[3]]);

    const minLon = min[0];
    const minLat = min[1];
    const maxLon = max[0];
    const maxLat = max[1];

    return {
      type: 'Polygon',
      coordinates: [
        [
          [minLon, minLat],
          [maxLon, minLat],
          [maxLon, maxLat],
          [minLon, maxLat],
          [minLon, minLat],
        ],
      ],
    };
  }

  private wmsLayer?: TileLayer<TileWMS>;
  private wmsSource?: TileWMS;
  private compareLeftLayer?: TileLayer<TileWMS>;
  private compareLeftSource?: TileWMS;
  private compareRightLayer?: TileLayer<TileWMS>;
  private compareRightSource?: TileWMS;
  private featureInfoKey?: EventsKey;
  private compareLeftClipKeys: EventsKey[] = [];
  private compareRightClipKeys: EventsKey[] = [];
  private dividerPointerMoveListener?: (evt: PointerEvent) => void;
  private dividerPointerUpListener?: (evt: PointerEvent) => void;
  private dividerPointerId?: number;
  private compareSelectionToken = 0;
  private capabilitiesDocPromise?: Promise<Document | null>;
  private capabilitiesDocFetchedAt = 0;
  private readonly capabilitiesCacheTtlMs = 15_000;
  private pendingSelectionLogLayerName?: string;
  private infoPanelToken = 0;

  private catalog: Catalog = { version: '1.0', phenomena: [] };
  private hasCapabilities = false;
  private capabilityLayerNames = new Set<string>();

  private metadataStatus: 'ok' | 'missing' = 'missing';
  private acquisitionDate1 = 'Unknown date';
  private acquisitionDate2 = 'Unknown date';
  private metadataWarning = 'Temporal metadata unavailable';
  private metadataReasonFromApi: string | null = null;
  private legendMetadata?: Product['legend'];

  showBasemapPanel = false;
  activeBasemapId = 'osm';

  readonly basemaps: BasemapItem[] = [
    {
      id: 'osm',
      label: 'OpenStreetMap',
      desc: 'Standard',
      thumb: 'assets/mapsicons/osm.png',
      kind: 'OSM',
    },
    {
      id: 'cartoLight',
      label: 'Carto Light',
      desc: 'Clair',
      thumb: 'assets/mapsicons/carto-light.png',
      kind: 'XYZ',
      url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    },
    {
      id: 'osmHot',
      label: 'OSM Humanitarian',
      desc: 'OSM HOT',
      thumb: 'assets/mapsicons/osm-hot.png',
      kind: 'XYZ',
      url: 'https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    },
    {
      id: 'esriNatGeo',
      label: 'Esri NatGeo World Map',
      desc: 'NatGeo',
      thumb: 'assets/mapsicons/NatGeoWOrdmap.png',
      kind: 'XYZ',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    },
    {
      id: 'esriUsaTopo',
      label: 'Esri USA Topo Maps',
      desc: 'Topo',
      thumb: 'assets/mapsicons/EsriUSATOPOMAPS.png',
      kind: 'XYZ',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/{z}/{y}/{x}',
    },
    {
      id: 'esriWorldImagery',
      label: 'Esri World Imagery',
      desc: 'Satellite',
      thumb: 'assets/mapsicons/ESRIWORLDIMAGERY.png',
      kind: 'XYZ',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    },
    {
      id: 'esriWorldPhysical',
      label: 'Esri World Physical Map',
      desc: 'Physical',
      thumb: 'assets/mapsicons/WORLDPHYSICALMAP.png',
      kind: 'XYZ',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
    },
    {
      id: 'esriWorldStreet',
      label: 'Esri World Street Map',
      desc: 'Street',
      thumb: 'assets/mapsicons/ESRIWORLDSTREETMAP.png',
      kind: 'XYZ',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    },
    {
      id: 'esriWorldTopo',
      label: 'Esri World Topo Map',
      desc: 'Topo',
      thumb: 'assets/mapsicons/ESRIWORLDTOPOMAP.png',
      kind: 'XYZ',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    },
    {
      id: 'openTopoMap',
      label: 'OpenTopoMap',
      desc: 'Relief',
      thumb: 'assets/mapsicons/OPENSTREETMAP.png',
      kind: 'XYZ',
      url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    },
    {
      id: 'esriWorldShadedRelief',
      label: 'Esri World Shaded Relief',
      desc: 'Relief',
      thumb: 'assets/mapsicons/WorldShadedRelief.png',
      kind: 'XYZ',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
    },
    {
      id: 'esriWorldTerrainBase',
      label: 'Esri World Terrain Base',
      desc: 'Terrain',
      thumb: 'assets/mapsicons/WorldTerrainBase.png',
      kind: 'XYZ',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    },
  ];

  availableLayers: SatmonitorWmsLayerOption[] = [];
  compareOptions: CompareProductOption[] = [];
  selectedLayerId = '';
  wmsVisible = true;
  wmsOpacity = 0.8;
  lastFeatureInfo?: string;

  compareEnabled = false;
  compareIndex = '';
  splitRatio = 0.5;

  selectedIndicatorInfo: IndicatorInfo = {
    name: '—',
    measure: '—',
    typicalRange: '—',
    quickRead: [],
  };
  dateLabels: DateLabels = {
    date1Label: 'Unknown date',
    date2Label: 'Unknown date',
    metadataStatus: 'missing',
    warning: 'Temporal metadata unavailable',
  };
  legendUrl = '';
  legendExpanded = false;

  constructor(private http: HttpClient) {}

  get selectedLayer(): SatmonitorWmsLayerOption | undefined {
    return this.availableLayers.find((l) => l.id === this.selectedLayerId);
  }

  get currentBasemapThumb(): string {
    return this.basemaps.find((item) => item.id === this.activeBasemapId)?.thumb || 'assets/mapsicons/osm.png';
  }

  get showSecondPeriod(): boolean {
    if (this.compareEnabled) return true;
    const selected = this.selectedLayer;
    return selected?.slot === 'delta' || selected?.slot === 'final';
  }

  get singlePeriodLabel(): string {
    if (this.compareEnabled) return this.acquisitionDate1;
    const selected = this.selectedLayer;
    if (!selected) return this.acquisitionDate1;
    if (selected.slot === 't2') return this.acquisitionDate2;
    return this.acquisitionDate1;
  }

  ngAfterViewInit(): void {
    const selected = this.selectedLayer;
    const initialBasemap = this.basemaps.find((item) => item.id === this.activeBasemapId) ?? this.basemaps[0];
    this.baseLayer = new TileLayer({
      source: this.buildSource(initialBasemap),
    });

    this.wmsSource = new TileWMS({
      url: this.wmsUrl,
      projection: 'EPSG:3857',
      crossOrigin: 'anonymous',
      params: {
        SERVICE: 'WMS',
        VERSION: '1.1.0',
        LAYERS: selected?.layerName ?? '',
        STYLES: selected?.styleName ?? '',
        FORMAT: 'image/png',
        TRANSPARENT: true,
        TILED: true,
        SRS: 'EPSG:3857',
      },
      serverType: 'geoserver',
    });

    this.wmsLayer = new TileLayer({
      source: this.wmsSource,
      visible: this.wmsVisible,
      opacity: this.wmsOpacity,
    });
    this.wmsLayer.setZIndex(10);

    const compareSelection = this.getCompareSelection();
    this.compareLeftSource = new TileWMS({
      url: this.wmsUrl,
      projection: 'EPSG:3857',
      crossOrigin: 'anonymous',
      params: {
        SERVICE: 'WMS',
        VERSION: '1.1.0',
        LAYERS: compareSelection?.leftLayerName ?? '',
        STYLES: compareSelection?.styleName ?? '',
        FORMAT: 'image/png',
        TRANSPARENT: true,
        TILED: true,
        SRS: 'EPSG:3857',
        _t: Date.now(),
      },
      serverType: 'geoserver',
    });
    this.compareLeftLayer = new TileLayer({
      source: this.compareLeftSource,
      visible: false,
      opacity: this.wmsOpacity,
    });
    this.compareLeftLayer.setZIndex(10);

    this.compareRightSource = new TileWMS({
      url: this.wmsUrl,
      projection: 'EPSG:3857',
      crossOrigin: 'anonymous',
      params: {
        SERVICE: 'WMS',
        VERSION: '1.1.0',
        LAYERS: compareSelection?.rightLayerName ?? '',
        STYLES: compareSelection?.styleName ?? '',
        FORMAT: 'image/png',
        TRANSPARENT: true,
        TILED: true,
        SRS: 'EPSG:3857',
        _t: Date.now(),
      },
      serverType: 'geoserver',
    });
    this.compareRightLayer = new TileLayer({
      source: this.compareRightSource,
      visible: false,
      opacity: this.wmsOpacity,
    });
    this.compareRightLayer.setZIndex(11);

    this.installCompareClipping();

    this.map = new OlMap({
      target: this.mapEl.nativeElement,
      layers: [
        this.baseLayer,
        this.wmsLayer,
        this.compareLeftLayer,
        this.compareRightLayer,
      ],
      controls: defaultControls({
        zoom: false,
        rotate: false,
        attribution: true,
      }),
      view: new View({
        projection: 'EPSG:3857',
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });
    setTimeout(() => this.map?.updateSize(), 0);

    this.featureInfoKey = this.map.on('singleclick', (evt) => {
      const map = this.map;
      if (!map) return;

      const view = map.getView();
      const resolution = view.getResolution();
      const projection = view.getProjection();
      if (!resolution) return;

      const active = this.getActiveFeatureInfoSource(evt.pixel?.[0]);
      if (!active) return;

      const url = active.source.getFeatureInfoUrl(evt.coordinate, resolution, projection, {
        INFO_FORMAT: 'application/json',
        QUERY_LAYERS: active.layerName,
        FEATURE_COUNT: 10,
        _t: Date.now(),
      });
      if (!url) return;

      this.lastFeatureInfo = 'Chargement…';

      this.http.get<any>(url).subscribe({
        next: (data) => {
          const value = this.extractRasterValue(data);
          this.lastFeatureInfo = value !== undefined ? `Valeur : ${value}` : 'Aucune donnée';
          // eslint-disable-next-line no-console
          console.log('GetFeatureInfo', { url, data });
        },
        error: (err) => {
          this.lastFeatureInfo = 'Erreur de lecture';
          // eslint-disable-next-line no-console
          console.error('GetFeatureInfo error', { url, err });
        },
      });
    });

    this.rebuildCatalogDrivenState({ resetSelection: false, updateMap: true });
    void this.syncLayersFromCapabilities({ updateMap: true });
  }

  onOverlayToggle(): void {
    this.syncOverlayMode();
    const bust = { _t: Date.now() };
    if (this.compareEnabled) {
      this.compareLeftSource?.updateParams(bust);
      this.compareRightSource?.updateParams(bust);
    } else {
      this.wmsSource?.updateParams(bust);
    }
  }

  onOpacityChange(): void {
    const clamped = Math.max(0.6, Math.min(0.9, this.wmsOpacity));
    this.wmsOpacity = clamped;
    this.wmsLayer?.setOpacity(clamped);
    this.compareLeftLayer?.setOpacity(clamped);
    this.compareRightLayer?.setOpacity(clamped);
  }

  onLayerChange(): void {
    const selected = this.selectedLayer;
    if (!selected || !this.wmsSource) return;

    this.lastFeatureInfo = undefined;
    this.refreshGeoServerCard();
    this.wmsSource.updateParams({
      SERVICE: 'WMS',
      VERSION: '1.1.0',
      LAYERS: selected.layerName,
      STYLES: selected.styleName,
      FORMAT: 'image/png',
      TRANSPARENT: true,
      TILED: true,
      SRS: 'EPSG:3857',
      _t: Date.now(),
    });

    this.pendingSelectionLogLayerName = selected.layerName;
    void this.fitToSelectedLayerExtent();
  }

  onCompareToggle(): void {
    this.lastFeatureInfo = undefined;
    if (this.compareEnabled && !this.getCompareSelection()) {
      this.compareEnabled = false;
    }
    this.syncOverlayMode();
    if (this.compareEnabled) {
      void this.applyCompareSelection({ reason: 'toggle' });
    }
    this.refreshGeoServerCard();
  }

  onCompareIndexChange(): void {
    this.lastFeatureInfo = undefined;
    this.refreshGeoServerCard();
    void this.applyCompareSelection({ reason: 'index-change' });
  }

  onZoomToData(): void {
    if (this.compareEnabled) {
      void this.applyCompareSelection({ reason: 'zoom-click', fitOnly: true });
      return;
    }
    void this.fitToSelectedLayerExtent();
  }

  onDividerPointerDown(evt: PointerEvent): void {
    if (!this.compareEnabled) return;
    evt.preventDefault();
    evt.stopPropagation();

    this.dividerPointerId = evt.pointerId;
    try {
      (evt.currentTarget as HTMLElement | null)?.setPointerCapture?.(evt.pointerId);
    } catch {
      // ignore
    }

    this.updateSplitRatioFromClientX(evt.clientX);

    if (!this.dividerPointerMoveListener) {
      this.dividerPointerMoveListener = (moveEvt: PointerEvent) => {
        if (this.dividerPointerId === undefined || moveEvt.pointerId !== this.dividerPointerId) return;
        moveEvt.preventDefault();
        this.updateSplitRatioFromClientX(moveEvt.clientX);
      };
    }
    if (!this.dividerPointerUpListener) {
      this.dividerPointerUpListener = (upEvt: PointerEvent) => {
        if (this.dividerPointerId === undefined || upEvt.pointerId !== this.dividerPointerId) return;
        upEvt.preventDefault();
        this.dividerPointerId = undefined;
      };
    }

    window.addEventListener('pointermove', this.dividerPointerMoveListener, { passive: false });
    window.addEventListener('pointerup', this.dividerPointerUpListener, { passive: false });
    window.addEventListener('pointercancel', this.dividerPointerUpListener, { passive: false });
  }

  toggleLegend(): void {
    if (!this.legendUrl && !this.legendMetadata) return;
    this.legendExpanded = !this.legendExpanded;
  }

  toggleBasemap(): void {
    this.showBasemapPanel = !this.showBasemapPanel;
  }

  setBasemap(id: string): void {
    const item = this.basemaps.find((entry) => entry.id === id);
    if (!item || !this.baseLayer) return;

    this.activeBasemapId = id;
    this.baseLayer.setSource(this.buildSource(item));
    this.showBasemapPanel = false;
  }

  zoomIn(): void {
    const view = this.map?.getView();
    if (!view) return;
    view.setZoom((view.getZoom() || 0) + 1);
  }

  zoomOut(): void {
    const view = this.map?.getView();
    if (!view) return;
    view.setZoom((view.getZoom() || 0) - 1);
  }

  onSettingsClick(): void {
    console.log('settings');
  }

  asset(path: string): string {
    return `assets/${path}`.replace('assets/assets/', 'assets/');
  }

  async fitToSelectedLayerExtent(): Promise<void> {
    const map = this.map;
    const selected = this.selectedLayer;
    if (!map || !selected) return;
    const requestedLayerName = selected.layerName;

    try {
      let extent: [number, number, number, number] | null = null;
      let source = 'fallback';

      const doc = await this.getCapabilitiesDoc({ forceRefresh: true });
      if (doc && this.selectedLayer?.layerName === requestedLayerName) {
        const resolved = this.findLayerBbox(doc, requestedLayerName, 'EPSG:3857');
        if (resolved && resolved.extent.every(Number.isFinite) && resolved.extent[0] < resolved.extent[2] && resolved.extent[1] < resolved.extent[3]) {
          extent = resolved.extent;
          source = resolved.source;
        }
      }

      if (!extent) {
        const bboxWgs84 = selected.bboxWgs84 ?? null;
        if (bboxWgs84 && bboxWgs84.every(Number.isFinite) && bboxWgs84[0] < bboxWgs84[2] && bboxWgs84[1] < bboxWgs84[3]) {
          const transformed = transformExtent(bboxWgs84, 'EPSG:4326', 'EPSG:3857');
          const [minx, miny, maxx, maxy] = transformed;
          const isValid = [minx, miny, maxx, maxy].every(Number.isFinite) && minx < maxx && miny < maxy;
          if (isValid) {
            extent = transformed as [number, number, number, number];
            source = 'catalog:bbox_wgs84';
          }
        }
      }

      if (this.selectedLayer?.layerName !== requestedLayerName) return;

      if (!extent) {
        // eslint-disable-next-line no-console
        console.error('No valid bbox for layer', requestedLayerName, 'falling back to Dakar');
        if (this.pendingSelectionLogLayerName === requestedLayerName) this.pendingSelectionLogLayerName = undefined;
        map.getView().setCenter(fromLonLat(this.fallbackCenterLonLat));
        map.getView().setZoom(this.fallbackZoom);
        return;
      }

      const [minx, miny, maxx, maxy] = extent;
      const isValid = [minx, miny, maxx, maxy].every(Number.isFinite) && minx < maxx && miny < maxy;
      if (!isValid) {
        // eslint-disable-next-line no-console
        console.error('No valid bbox for layer', requestedLayerName, 'falling back to Dakar');
        if (this.pendingSelectionLogLayerName === requestedLayerName) this.pendingSelectionLogLayerName = undefined;
        map.getView().setCenter(fromLonLat(this.fallbackCenterLonLat));
        map.getView().setZoom(this.fallbackZoom);
        return;
      }

      if (this.selectedLayer?.layerName !== requestedLayerName) return;

      if (this.pendingSelectionLogLayerName === requestedLayerName) {
        this.pendingSelectionLogLayerName = undefined;
        // eslint-disable-next-line no-console
        console.log('WMS layer selection fit', { layer: requestedLayerName, bboxSource: source, extent });
      }

      map.getView().fit(extent, { padding: [24, 24, 24, 24], duration: 250 });
    } catch (err) {
      if (this.selectedLayer?.layerName !== requestedLayerName) return;
      // eslint-disable-next-line no-console
      console.error('No valid bbox for layer', requestedLayerName, 'falling back to Dakar', err);
      if (this.pendingSelectionLogLayerName === requestedLayerName) this.pendingSelectionLogLayerName = undefined;
      map.getView().setCenter(fromLonLat(this.fallbackCenterLonLat));
      map.getView().setZoom(this.fallbackZoom);
    }
  }

  zoomToLayer(): Promise<void> {
    return this.fitToSelectedLayerExtent();
  }

  private resolvePhenomenonId(candidate: string): string {
    const enabled = getPhenomena(this.catalog);
    if (!enabled.length) return '';
    const normalized = (candidate || '').trim();
    if (normalized && enabled.some((p) => p.id === normalized)) return normalized;
    return enabled[0].id;
  }

  private getActivePhenomenon(): Phenomenon | undefined {
    return getPhenomena(this.catalog).find((p) => p.id === this.phenomenonId);
  }

  private normalizeIsoDate(value: any): string | null {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return null;
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  private resolveDatesForProduct(product?: Product): { date1: string; date2: string; status: 'ok' | 'missing'; reason: string } {
    const active = this.getActivePhenomenon();
    const productHasOwnDates = !!(product?.date_1 || product?.date_2 || product?.datetime_1 || product?.datetime_2);
    const productStatus = productHasOwnDates ? product?.metadata_status : undefined;
    const productReason = productHasOwnDates ? product?.metadata_reason : undefined;
    const d1 = this.normalizeIsoDate(product?.date_1 ?? active?.date_1 ?? active?.dates?.t1 ?? this.acquisitionDate1);
    const d2 = this.normalizeIsoDate(product?.date_2 ?? active?.date_2 ?? active?.dates?.t2 ?? this.acquisitionDate2);
    const status = productStatus ?? active?.metadata_status ?? (d1 && d2 ? 'ok' : 'missing');
    const reason =
      productReason ??
      active?.metadata_reason ??
      this.metadataReasonFromApi ??
      'Acquisition metadata missing for one or both dates';
    return {
      date1: d1 ?? 'Unknown date',
      date2: d2 ?? 'Unknown date',
      status: status === 'ok' && d1 && d2 ? 'ok' : 'missing',
      reason,
    };
  }

  private updateTemporalMetadata(ctx?: any): void {
    const selectedProduct = this.getCurrentLegendProduct();
    const active = this.getActivePhenomenon();
    const productHasOwnDates = !!(
      selectedProduct?.date_1 || selectedProduct?.date_2 || selectedProduct?.datetime_1 || selectedProduct?.datetime_2
    );
    const productStatus = productHasOwnDates ? selectedProduct?.metadata_status : null;
    const productReason = productHasOwnDates ? selectedProduct?.metadata_reason : null;
    const parsedDate1 = this.normalizeIsoDate(
      selectedProduct?.date_1 ?? active?.date_1 ?? active?.dates?.t1 ?? ctx?.date_1 ?? ctx?.datetime_1
    );
    const parsedDate2 = this.normalizeIsoDate(
      selectedProduct?.date_2 ?? active?.date_2 ?? active?.dates?.t2 ?? ctx?.date_2 ?? ctx?.datetime_2
    );
    const apiStatus = ctx?.metadata_status === 'ok' ? 'ok' : ctx?.metadata_status === 'missing' ? 'missing' : null;
    const catalogStatus = productStatus ?? active?.metadata_status ?? null;
    const status = apiStatus ?? catalogStatus ?? (parsedDate1 && parsedDate2 ? 'ok' : 'missing');

    this.metadataReasonFromApi = typeof ctx?.metadata_reason === 'string' && ctx.metadata_reason.trim() ? ctx.metadata_reason.trim() : null;
    const reason =
      productReason ??
      active?.metadata_reason ??
      this.metadataReasonFromApi ??
      'Acquisition metadata missing for one or both dates';

    this.metadataStatus = status === 'ok' && parsedDate1 && parsedDate2 ? 'ok' : 'missing';
    this.acquisitionDate1 = parsedDate1 ?? 'Unknown date';
    this.acquisitionDate2 = parsedDate2 ?? 'Unknown date';
    this.metadataWarning = this.metadataStatus === 'missing' ? reason : '';

    if (this.metadataStatus === 'missing' && (ctx || this.availableLayers.length > 0)) {
      // eslint-disable-next-line no-console
      console.warn('Temporal metadata missing in catalog/context', {
        phenomenon: this.phenomenonId,
        t1: active?.dates?.t1 ?? null,
        t2: active?.dates?.t2 ?? null,
        date_1: ctx?.date_1 ?? null,
        date_2: ctx?.date_2 ?? null,
        metadata_status: ctx?.metadata_status ?? null,
        metadata_reason: reason,
      });
    }
  }

  private formatProductLabel(product: Product, slot: LayerSlot): string {
    const dates = this.resolveDatesForProduct(product);
    const d1 = dates.date1;
    const d2 = dates.date2;
    if (slot === 't1') return `${product.label} (${d1})`;
    if (slot === 't2') return `${product.label} (${d2})`;
    return `${product.label} (${d1} → ${d2})`;
  }

  private toLayerOption(product: Product, slot: LayerSlot, layerName: string): SatmonitorWmsLayerOption {
    return {
      id: `${product.id}:${slot}`,
      label: this.formatProductLabel(product, slot),
      productId: product.id,
      productLabel: product.label,
      slot,
      kind: product.kind,
      layerName,
      styleName: '',
      legend: product.legend,
      bboxWgs84: product.bbox_wgs84 ?? null,
    };
  }

  private buildLayerOptionsFromCatalog(): SatmonitorWmsLayerOption[] {
    const products = getProducts(this.catalog, this.phenomenonId);
    const options: SatmonitorWmsLayerOption[] = [];

    for (const product of products) {
      const layers = resolveRenderableLayers(product, 'single');
      for (const layerRef of layers) {
        options.push(this.toLayerOption(product, layerRef.slot, layerRef.layer));
      }
    }

    return options;
  }

  private buildCompareOptionsFromCatalog(): CompareProductOption[] {
    const products = getCompareProducts(this.catalog, this.phenomenonId);
    const options: CompareProductOption[] = [];

    for (const product of products) {
      const pair = resolveRenderableLayers(product, 'compare');
      if (pair.length < 2) continue;
      const dates = this.resolveDatesForProduct(product);
      options.push({
        id: product.id,
        label: `${product.label} (${dates.date1} ↔ ${dates.date2})`,
        productId: product.id,
        kind: product.kind,
        leftLayerName: pair[0].layer,
        rightLayerName: pair[1].layer,
        styleName: '',
        legend: product.legend,
        bboxWgs84: product.bbox_wgs84 ?? null,
      });
    }

    return options;
  }

  private normalizeLayerName(layerName: string): string {
    return (layerName || '').trim().toLowerCase();
  }

  private isLayerAvailableInCapabilities(layerName: string): boolean {
    if (!this.hasCapabilities) return true;
    const normalized = this.normalizeLayerName(layerName);
    if (!normalized) return false;
    if (this.capabilityLayerNames.has(normalized)) return true;
    const unqualified = normalized.includes(':') ? normalized.split(':').slice(1).join(':') : normalized;
    return this.capabilityLayerNames.has(unqualified);
  }

  private rebuildCatalogDrivenState(opts: { resetSelection?: boolean; updateMap?: boolean }): void {
    this.phenomenonId = this.resolvePhenomenonId(this.phenomenonId);

    const previousLayer = this.selectedLayerId;
    const previousCompare = this.compareIndex;

    const baseLayers = this.buildLayerOptionsFromCatalog();
    const filteredLayers = baseLayers.filter((opt) => this.isLayerAvailableInCapabilities(opt.layerName));
    this.availableLayers = filteredLayers.length ? filteredLayers : baseLayers;

    const baseCompare = this.buildCompareOptionsFromCatalog();
    const filteredCompare = baseCompare.filter(
      (opt) => this.isLayerAvailableInCapabilities(opt.leftLayerName) && this.isLayerAvailableInCapabilities(opt.rightLayerName)
    );
    this.compareOptions = filteredCompare.length ? filteredCompare : baseCompare;

    if (opts.resetSelection || !this.availableLayers.some((l) => l.id === previousLayer)) {
      this.selectedLayerId = this.availableLayers[0]?.id ?? '';
    }

    if (opts.resetSelection || !this.compareOptions.some((opt) => opt.id === previousCompare)) {
      this.compareIndex = this.compareOptions[0]?.id ?? '';
    }

    if (!this.compareOptions.length) {
      this.compareEnabled = false;
    }

    this.updateTemporalMetadata(undefined);
    this.refreshGeoServerCard();

    if (!opts.updateMap || !this.map) return;

    const selected = this.selectedLayer;
    if (selected && this.wmsSource) {
      this.lastFeatureInfo = undefined;
      this.wmsSource.updateParams({
        SERVICE: 'WMS',
        VERSION: '1.1.0',
        LAYERS: selected.layerName,
        STYLES: selected.styleName,
        FORMAT: 'image/png',
        TRANSPARENT: true,
        TILED: true,
        SRS: 'EPSG:3857',
        _t: Date.now(),
      });
    }

    this.syncOverlayMode();
    if (this.compareEnabled && this.getCompareSelection()) {
      void this.applyCompareSelection({ reason: 'toggle' });
    } else {
      const layerName = selected?.layerName;
      if (layerName) {
        this.pendingSelectionLogLayerName = layerName;
        void this.fitToSelectedLayerExtent();
      }
    }
  }

  private async syncLayersFromCapabilities(opts: { updateMap?: boolean } = {}): Promise<void> {
    const doc = await this.getCapabilitiesDoc();
    if (!doc) return;

    const rawLayerNames = this.extractLayerNamesFromCapabilities(doc);
    this.capabilityLayerNames = new Set(rawLayerNames.map((name) => this.normalizeLayerName(name)));
    this.hasCapabilities = true;

    // eslint-disable-next-line no-console
    console.debug('GeoServer GetCapabilities layers (raw)', rawLayerNames);

    this.rebuildCatalogDrivenState({ resetSelection: false, updateMap: opts.updateMap ?? false });

    // eslint-disable-next-line no-console
    console.debug('GeoServer dropdown layers (filtered)', this.availableLayers.map((opt) => opt.layerName));
  }

  private extractLayerNamesFromCapabilities(doc: Document): string[] {
    const layerElsNs = Array.from(doc.getElementsByTagNameNS('*', 'Layer')) as Element[];
    const layerEls = layerElsNs.length ? layerElsNs : (Array.from(doc.getElementsByTagName('Layer')) as Element[]);
    const names: string[] = [];
    const seen = new Set<string>();

    for (const layerEl of layerEls) {
      const nameEl = Array.from(layerEl.children).find((c) => (c as Element).localName === 'Name') as Element | undefined;
      const rawName = (nameEl?.textContent ?? '').trim();
      if (!rawName || seen.has(rawName)) continue;
      seen.add(rawName);
      names.push(rawName);
    }

    return names;
  }

  private buildIndicatorInfo(product: Product | undefined): IndicatorInfo {
    if (!product) {
      return { name: '—', measure: '—', typicalRange: '—', quickRead: [] };
    }

    const legend = product.legend;
    let typicalRange = '—';
    if (legend?.type === 'continuous' && legend.min !== undefined && legend.max !== undefined) {
      typicalRange = `${legend.min} → ${legend.max}`;
    } else if (legend?.type === 'categorical' && Array.isArray(legend.classes)) {
      typicalRange = `${legend.classes.length} classes`;
    }

    const measureByKind: Record<Product['kind'], string> = {
      index: 'Indice raster',
      delta: 'Variation inter-temporelle',
      binary_mask: 'Masque binaire',
      vector: 'Couche vectorielle',
    };

    const quickRead: string[] = [];
    if (legend?.type === 'continuous') {
      quickRead.push('Valeurs faibles à élevées selon la palette continue');
    }
    if (legend?.type === 'categorical') {
      quickRead.push('Interprétation par classes catégorielles');
    }

    return {
      name: product.label,
      measure: measureByKind[product.kind],
      typicalRange,
      quickRead,
    };
  }

  private refreshGeoServerCard(): void {
    const selectedProduct = this.getCurrentLegendProduct();
    this.selectedIndicatorInfo = this.buildIndicatorInfo(selectedProduct);
    this.legendMetadata = selectedProduct?.legend;

    const legendTarget = this.getLegendTarget();
    this.legendUrl = legendTarget ? this.buildLegendUrl(legendTarget.layerName, legendTarget.styleName) : '';
    this.legendExpanded = false;

    const token = ++this.infoPanelToken;
    void this.resolveCurrentDateLabels(token);
  }

  private getCurrentLegendProduct(): Product | undefined {
    if (this.compareEnabled) {
      const selectedCompare = this.getCompareSelection();
      if (!selectedCompare) return undefined;
      return getProducts(this.catalog, this.phenomenonId).find((product) => product.id === selectedCompare.productId);
    }

    const selectedLayer = this.selectedLayer;
    if (!selectedLayer) return undefined;
    return getProducts(this.catalog, this.phenomenonId).find((product) => product.id === selectedLayer.productId);
  }

  private getLegendTarget(): { layerName: string; styleName: string } | null {
    if (this.compareEnabled) {
      const selection = this.getCompareSelection();
      if (!selection) return null;
      return { layerName: selection.leftLayerName, styleName: selection.styleName };
    }

    const selected = this.selectedLayer;
    if (!selected) return null;
    return { layerName: selected.layerName, styleName: selected.styleName };
  }

  private buildLegendUrl(layerName: string, styleName: string): string {
    const params = new URLSearchParams({
      REQUEST: 'GetLegendGraphic',
      VERSION: '1.1.0',
      FORMAT: 'image/png',
      LAYER: layerName,
    });
    if (styleName) params.set('STYLE', styleName);
    return `${this.wmsUrl}?${params.toString()}`;
  }

  private async resolveCurrentDateLabels(token: number): Promise<void> {
    const labels = await this.computeDateLabelsForCurrentSelection();
    if (token !== this.infoPanelToken) return;
    this.dateLabels = labels;
  }

  private async computeDateLabelsForCurrentSelection(): Promise<DateLabels> {
    const selectedProduct = this.getCurrentLegendProduct();
    const productDates = this.resolveDatesForProduct(selectedProduct);
    const base: DateLabels = {
      date1Label: productDates.date1,
      metadataStatus: productDates.status,
      warning: productDates.status === 'missing' ? productDates.reason : undefined,
    };

    if (this.compareEnabled) {
      return { ...base, date2Label: productDates.date2 };
    }

    const selected = this.selectedLayer;
    if (!selected) {
      return { ...base, date2Label: productDates.date2 };
    }

    if (selected.slot === 't2') {
      return { ...base, date1Label: productDates.date2 };
    }

    if (selected.slot === 'delta' || selected.slot === 'final') {
      return { ...base, date2Label: productDates.date2 };
    }

    return base;
  }

  private getCompareSelection(): CompareProductOption | null {
    if (!this.compareOptions.length) return null;
    if (!this.compareIndex) return this.compareOptions[0];
    return this.compareOptions.find((opt) => opt.id === this.compareIndex) ?? this.compareOptions[0];
  }

  private syncOverlayMode(): void {
    if (this.compareEnabled) {
      this.wmsLayer?.setVisible(false);
      this.compareLeftLayer?.setVisible(this.wmsVisible);
      this.compareRightLayer?.setVisible(this.wmsVisible);
      this.map?.render();
      return;
    }

    this.compareLeftLayer?.setVisible(false);
    this.compareRightLayer?.setVisible(false);
    this.wmsLayer?.setVisible(this.wmsVisible);
  }

  private getActiveFeatureInfoSource(pixelX: number | undefined): { source: TileWMS; layerName: string } | null {
    if (!this.map) return null;

    if (this.compareEnabled) {
      const leftSource = this.compareLeftSource;
      const rightSource = this.compareRightSource;
      const selection = this.getCompareSelection();
      if (!leftSource || !rightSource || !selection) return null;
      if (!this.compareLeftLayer?.getVisible() || !this.compareRightLayer?.getVisible()) return null;

      const width = this.map.getSize()?.[0];
      const dividerX = width && typeof pixelX === 'number' ? width * this.splitRatio : undefined;
      const useLeft = dividerX !== undefined && typeof pixelX === 'number' ? pixelX <= dividerX : true;
      return useLeft
        ? { source: leftSource, layerName: selection.leftLayerName }
        : { source: rightSource, layerName: selection.rightLayerName };
    }

    const selectedLayer = this.selectedLayer;
    if (!this.wmsSource || !this.wmsLayer?.getVisible() || !selectedLayer) return null;
    return { source: this.wmsSource, layerName: selectedLayer.layerName };
  }

  private installCompareClipping(): void {
    const leftLayer = this.compareLeftLayer;
    const rightLayer = this.compareRightLayer;
    if (!leftLayer || !rightLayer) return;

    const clipLeftKey = leftLayer.on('prerender', (evt: any) => {
      const ctx = evt?.context as CanvasRenderingContext2D | undefined;
      if (!ctx) return;
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const dividerX = Math.round(width * this.splitRatio);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, dividerX, height);
      ctx.clip();
    });
    const clipLeftRestoreKey = leftLayer.on('postrender', (evt: any) => {
      const ctx = evt?.context as CanvasRenderingContext2D | undefined;
      if (!ctx) return;
      ctx.restore();
    });
    this.compareLeftClipKeys.push(clipLeftKey, clipLeftRestoreKey);

    const clipRightKey = rightLayer.on('prerender', (evt: any) => {
      const ctx = evt?.context as CanvasRenderingContext2D | undefined;
      if (!ctx) return;
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const dividerX = Math.round(width * this.splitRatio);
      ctx.save();
      ctx.beginPath();
      ctx.rect(dividerX, 0, width - dividerX, height);
      ctx.clip();
    });
    const clipRightRestoreKey = rightLayer.on('postrender', (evt: any) => {
      const ctx = evt?.context as CanvasRenderingContext2D | undefined;
      if (!ctx) return;
      ctx.restore();
    });
    this.compareRightClipKeys.push(clipRightKey, clipRightRestoreKey);
  }

  private updateSplitRatioFromClientX(clientX: number): void {
    const rect = this.mapEl?.nativeElement?.getBoundingClientRect?.();
    if (!rect || rect.width <= 0) return;

    const ratio = (clientX - rect.left) / rect.width;
    this.splitRatio = Math.max(0, Math.min(1, ratio));
    this.map?.render();
  }

  private buildSource(item: BasemapItem): OSM | XYZ {
    if (item.kind === 'OSM') {
      return new OSM({ crossOrigin: 'anonymous' });
    }

    return new XYZ({
      url: item.url!,
      crossOrigin: 'anonymous',
    });

    // // Pour éviter les “maps grises” après affichage dans un container flex
    // setTimeout(() => this.map.updateSize(), 0);
  }

  private async applyCompareSelection(opts: { reason: 'init' | 'toggle' | 'index-change' | 'zoom-click'; fitOnly?: boolean }): Promise<void> {
    const map = this.map;
    const leftSource = this.compareLeftSource;
    const rightSource = this.compareRightSource;
    const selection = this.getCompareSelection();
    if (!map || !leftSource || !rightSource || !selection) return;
    if (!this.compareEnabled) return;

    leftSource.updateParams({
      SERVICE: 'WMS',
      VERSION: '1.1.0',
      LAYERS: selection.leftLayerName,
      STYLES: selection.styleName,
      FORMAT: 'image/png',
      TRANSPARENT: true,
      TILED: true,
      SRS: 'EPSG:3857',
      _t: Date.now(),
    });
    rightSource.updateParams({
      SERVICE: 'WMS',
      VERSION: '1.1.0',
      LAYERS: selection.rightLayerName,
      STYLES: selection.styleName,
      FORMAT: 'image/png',
      TRANSPARENT: true,
      TILED: true,
      SRS: 'EPSG:3857',
      _t: Date.now(),
    });

    this.syncOverlayMode();

    const token = ++this.compareSelectionToken;
    const requestedLayerName = selection.leftLayerName;
    let bboxSource: string = 'fallback';
    let extent: [number, number, number, number] | null = null;

    try {
      const doc = await this.getCapabilitiesDoc({ forceRefresh: true });
      if (token !== this.compareSelectionToken || !this.compareEnabled) return;
      if (doc) {
        const resolved = this.findLayerBbox(doc, requestedLayerName, 'EPSG:3857');
        if (resolved && resolved.extent.every(Number.isFinite) && resolved.extent[0] < resolved.extent[2] && resolved.extent[1] < resolved.extent[3]) {
          bboxSource = resolved.source;
          extent = resolved.extent;
        }
      }

      if (!extent) {
        const bboxWgs84 = selection.bboxWgs84 ?? null;
        if (bboxWgs84 && bboxWgs84.every(Number.isFinite) && bboxWgs84[0] < bboxWgs84[2] && bboxWgs84[1] < bboxWgs84[3]) {
          const e = transformExtent(bboxWgs84, 'EPSG:4326', 'EPSG:3857');
          if (e.every(Number.isFinite) && e[0] < e[2] && e[1] < e[3]) {
            bboxSource = 'catalog:bbox_wgs84';
            extent = e as [number, number, number, number];
          }
        }
      }

      if (!extent || !extent.every(Number.isFinite) || extent[0] >= extent[2] || extent[1] >= extent[3]) {
        // eslint-disable-next-line no-console
        console.error('No valid bbox for layer', requestedLayerName, 'falling back to Dakar');
        map.getView().setCenter(fromLonLat(this.fallbackCenterLonLat));
        map.getView().setZoom(this.fallbackZoom);
      } else {
        map.getView().fit(extent, { padding: [24, 24, 24, 24], duration: 250 });
      }
    } catch (err) {
      if (token !== this.compareSelectionToken || !this.compareEnabled) return;
      // eslint-disable-next-line no-console
      console.error('No valid bbox for layer', requestedLayerName, 'falling back to Dakar', err);
      map.getView().setCenter(fromLonLat(this.fallbackCenterLonLat));
      map.getView().setZoom(this.fallbackZoom);
    }

    if (token !== this.compareSelectionToken || !this.compareEnabled) return;
    if (!opts.fitOnly && (opts.reason === 'init' || opts.reason === 'toggle' || opts.reason === 'index-change')) {
      // eslint-disable-next-line no-console
      console.log('WMS compare selection', {
        product: selection.productId,
        leftLayer: selection.leftLayerName,
        rightLayer: selection.rightLayerName,
        splitRatio: this.splitRatio,
        bboxSource,
        extent,
      });
    }
  }

  private extractRasterValue(data: any): string | undefined {
    const features = data?.features;
    if (!Array.isArray(features) || features.length === 0) return undefined;

    const props = features[0]?.properties;
    if (!props || typeof props !== 'object') return undefined;

    if (props.GRAY_INDEX !== undefined && props.GRAY_INDEX !== null) return String(props.GRAY_INDEX);

    for (const value of Object.values(props)) {
      if (typeof value === 'number') return String(value);
      if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return value;
    }

    return undefined;
  }

  private async getCapabilitiesDoc(opts: { forceRefresh?: boolean } = {}): Promise<Document | null> {
    const forceRefresh = !!opts.forceRefresh;
    const cacheAgeMs = Date.now() - this.capabilitiesDocFetchedAt;
    if (!forceRefresh && this.capabilitiesDocPromise && cacheAgeMs >= 0 && cacheAgeMs <= this.capabilitiesCacheTtlMs) {
      return this.capabilitiesDocPromise;
    }

    const url = `${this.wmsUrl}?service=WMS&version=1.1.0&request=GetCapabilities&_t=${Date.now()}`;
    this.capabilitiesDocPromise = firstValueFrom(this.http.get(url, { responseType: 'text' as const }))
      .then((xml) => {
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        if (doc.getElementsByTagName('parsererror').length > 0) {
          // eslint-disable-next-line no-console
          console.error('WMS GetCapabilities returned invalid XML', { url });
          this.capabilitiesDocPromise = undefined;
          this.capabilitiesDocFetchedAt = 0;
          return null;
        }
        this.capabilitiesDocFetchedAt = Date.now();
        return doc;
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to load WMS GetCapabilities', { url, err });
        this.capabilitiesDocPromise = undefined;
        this.capabilitiesDocFetchedAt = 0;
        return null;
      });

    return this.capabilitiesDocPromise;
  }

  private findLayerBbox(
    doc: Document,
    layerName: string,
    srs: string
  ): { extent: [number, number, number, number]; source: string } | null {
    const layerElsNs = Array.from(doc.getElementsByTagNameNS('*', 'Layer'));
    const layerEls = layerElsNs.length ? layerElsNs : Array.from(doc.getElementsByTagName('Layer'));

    const getLayerName = (layerEl: Element): string => {
      const nameEl = Array.from(layerEl.children).find((c) => (c as Element).localName === 'Name');
      return (nameEl?.textContent ?? '').trim();
    };

    const requested = (layerName || '').trim().toLowerCase();
    const requestedUnqualified = requested.includes(':') ? requested.split(':').slice(1).join(':') : requested;
    const toUnqualified = (value: string): string => (value.includes(':') ? value.split(':').slice(1).join(':') : value);

    const targetLayer = layerEls.find((layerEl) => {
      const current = getLayerName(layerEl).trim().toLowerCase();
      if (!current) return false;
      const currentUnqualified = toUnqualified(current);
      return (
        current === requested ||
        currentUnqualified === requested ||
        current === requestedUnqualified ||
        currentUnqualified === requestedUnqualified
      );
    });
    if (!targetLayer) return null;

    let bboxEls = Array.from(targetLayer.children).filter((c) => (c as Element).localName === 'BoundingBox') as Element[];
    if (bboxEls.length === 0) {
      const bboxElsNs = Array.from(targetLayer.getElementsByTagNameNS('*', 'BoundingBox'));
      bboxEls = bboxElsNs.length ? (bboxElsNs as Element[]) : (Array.from(targetLayer.getElementsByTagName('BoundingBox')) as Element[]);
    }

    const normalizeSrs = (value: string | null): string => (value ?? '').trim().toUpperCase();
    const findBbox = (wantedSrs: string): Element | undefined =>
      bboxEls.find((el) => normalizeSrs(el.getAttribute('SRS') || el.getAttribute('CRS')) === wantedSrs.toUpperCase());

    const bboxEl = srs === 'EPSG:3857' ? findBbox('EPSG:3857') ?? findBbox('EPSG:900913') : findBbox(srs);
    const to3857 = (extent: [number, number, number, number], sourceSrs: string | null): [number, number, number, number] | null => {
      const normalized = normalizeSrs(sourceSrs);
      if (!normalized) return null;
      if (normalized === 'EPSG:3857' || normalized === 'EPSG:900913') return extent;
      try {
        const transformed = transformExtent(extent, normalized, 'EPSG:3857');
        const [x1, y1, x2, y2] = transformed;
        if (![x1, y1, x2, y2].every(Number.isFinite) || x1 >= x2 || y1 >= y2) return null;
        return [x1, y1, x2, y2];
      } catch {
        return null;
      }
    };

    if (bboxEl) {
      const bboxSrs = normalizeSrs(bboxEl.getAttribute('SRS') || bboxEl.getAttribute('CRS'));
      const minx = Number(bboxEl.getAttribute('minx'));
      const miny = Number(bboxEl.getAttribute('miny'));
      const maxx = Number(bboxEl.getAttribute('maxx'));
      const maxy = Number(bboxEl.getAttribute('maxy'));
      if (![minx, miny, maxx, maxy].every(Number.isFinite)) return null;
      const extent3857 = to3857([minx, miny, maxx, maxy], bboxSrs);
      if (!extent3857) return null;
      return {
        extent: extent3857,
        source: bboxSrs === 'EPSG:900913' ? 'EPSG:900913' : 'EPSG:3857',
      };
    }

    let geoEl = (Array.from(targetLayer.children).find((c) => (c as Element).localName === 'EX_GeographicBoundingBox') as Element | undefined) ?? undefined;
    if (!geoEl) {
      const geoNs = targetLayer.getElementsByTagNameNS('*', 'EX_GeographicBoundingBox').item(0) as Element | null;
      geoEl = geoNs ?? (targetLayer.getElementsByTagName('EX_GeographicBoundingBox').item(0) as Element | null) ?? undefined;
    }
    if (geoEl) {
      const west = Number(
        (
          (Array.from(geoEl.children).find((c) => (c as Element).localName === 'westBoundLongitude') as Element | undefined)?.textContent ??
          ''
        ).trim()
      );
      const south = Number(
        (
          (Array.from(geoEl.children).find((c) => (c as Element).localName === 'southBoundLatitude') as Element | undefined)?.textContent ??
          ''
        ).trim()
      );
      const east = Number(
        (
          (Array.from(geoEl.children).find((c) => (c as Element).localName === 'eastBoundLongitude') as Element | undefined)?.textContent ??
          ''
        ).trim()
      );
      const north = Number(
        (
          (Array.from(geoEl.children).find((c) => (c as Element).localName === 'northBoundLatitude') as Element | undefined)?.textContent ??
          ''
        ).trim()
      );
      if ([west, south, east, north].every(Number.isFinite) && west < east && south < north) {
        const [x1, y1] = fromLonLat([west, south]);
        const [x2, y2] = fromLonLat([east, north]);
        if ([x1, y1, x2, y2].every(Number.isFinite) && x1 < x2 && y1 < y2) {
          return { extent: [x1, y1, x2, y2], source: 'EX_GeographicBoundingBox' };
        }
      }
    }

    let llEl =
      (Array.from(targetLayer.children).find((c) => (c as Element).localName === 'LatLonBoundingBox') as Element | undefined) ?? undefined;
    if (!llEl) {
      const llElNs = targetLayer.getElementsByTagNameNS('*', 'LatLonBoundingBox').item(0) as Element | null;
      llEl = llElNs ?? (targetLayer.getElementsByTagName('LatLonBoundingBox').item(0) as Element | null) ?? undefined;
    }
    if (llEl) {
      const minLon = Number(llEl.getAttribute('minx'));
      const minLat = Number(llEl.getAttribute('miny'));
      const maxLon = Number(llEl.getAttribute('maxx'));
      const maxLat = Number(llEl.getAttribute('maxy'));
      if ([minLon, minLat, maxLon, maxLat].every(Number.isFinite) && minLon < maxLon && minLat < maxLat) {
        const [minx, miny] = fromLonLat([minLon, minLat]);
        const [maxx, maxy] = fromLonLat([maxLon, maxLat]);
        if ([minx, miny, maxx, maxy].every(Number.isFinite) && minx < maxx && miny < maxy) {
          return { extent: [minx, miny, maxx, maxy], source: 'LatLonBoundingBox' };
        }
      }
    }

    // Last resort: try any declared BoundingBox and transform to map CRS.
    // This is less reliable than the geographic boxes (some servers keep stale bbox in non-native CRSs).
    for (const genericBbox of bboxEls) {
      const bboxSrs = normalizeSrs(genericBbox.getAttribute('SRS') || genericBbox.getAttribute('CRS'));
      if (!bboxSrs) continue;
      const minx = Number(genericBbox.getAttribute('minx'));
      const miny = Number(genericBbox.getAttribute('miny'));
      const maxx = Number(genericBbox.getAttribute('maxx'));
      const maxy = Number(genericBbox.getAttribute('maxy'));
      if (![minx, miny, maxx, maxy].every(Number.isFinite)) continue;
      const extent3857 = to3857([minx, miny, maxx, maxy], bboxSrs);
      if (!extent3857) continue;
      return { extent: extent3857, source: `BoundingBox:${bboxSrs}` };
    }

    return null;
  }

  ngOnDestroy(): void {
    if (this.featureInfoKey) unByKey(this.featureInfoKey);
    if (this.compareLeftClipKeys.length) unByKey(this.compareLeftClipKeys);
    if (this.compareRightClipKeys.length) unByKey(this.compareRightClipKeys);
    if (this.dividerPointerMoveListener) window.removeEventListener('pointermove', this.dividerPointerMoveListener);
    if (this.dividerPointerUpListener) {
      window.removeEventListener('pointerup', this.dividerPointerUpListener);
      window.removeEventListener('pointercancel', this.dividerPointerUpListener);
    }
    this.map?.setTarget(undefined);
    this.map = undefined;
  }
}
