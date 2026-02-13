import { Component, ViewChild, AfterViewInit, OnInit, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { SatMapComponent } from '../../components/sat-map/sat-map.component';
import type { MapToolType } from '../../components/map-toolbar/map-toolbar.component';
import { TraitementApiService } from './traitement-api.service';
import type { TraitementPipelineContext, TraitementRunRequest } from './traitement-api.models';
import { buildTraitementRunPayload } from './run-payload.builder';
import {
  type Catalog,
  getPhenomena,
  normalizeCatalogPayload,
} from 'src/domain/catalog/adapter';
import { MapUtilsService } from 'src/app/http_services/map-utils/map-utils.service';


@Component({
  selector: 'app-dashboard-map',
  templateUrl: './dashboard-map.component.html',
  styleUrls: ['./dashboard-map.component.css']
})
export class DashboardMapComponent implements AfterViewInit, OnInit {
  @ViewChild('mapComponent') mapComponent?: SatMapComponent;

  toolbarVisible = true;
  rightPanelVisible = true;
  activeTool: MapToolType = 'search-data';

  isLoadingPhenomena = false;
  phenomenaLoadError?: string;
  availablePhenomena: Array<{ id: string; name: string }> = [];
  selectedPhenomenonId = '';
  selectedIndicators: string[] = [];

  catalogWarnings: string[] = [];
  catalog: Catalog = { version: '1.0', phenomena: [] };

  pipelineContext?: TraitementPipelineContext;
  lastRunError?: string;
  isRunning = false;

  aoiMode: 'viewport' | 'drawn' = 'viewport';
  drawnAoiGeoJson?: any;

  dateRange = {
    start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  constructor(
    private router: Router,
    private mapUtils: MapUtilsService,
    private traitementApi: TraitementApiService
  ) {}

  ngOnInit(): void {
    void this.loadCatalog();
  }

  ngAfterViewInit(): void {
    if (this.mapComponent?.getMap) {
      this.mapUtils.initializeMeasurementTools(this.mapComponent.getMap);
    }
    this.pushCatalogToMap();
  }

  back(): void {
    this.router.navigate(['/dashboard/home']);
  }

  toggleToolbar(): void {
    this.toolbarVisible = !this.toolbarVisible;
  }

  onToolChanged(tool: MapToolType): void {
    this.activeTool = tool;
    this.rightPanelVisible = tool !== 'none';
  }

  async loadCatalog(): Promise<void> {
    this.isLoadingPhenomena = true;
    this.phenomenaLoadError = undefined;

    try {
      const rawCatalog = await this.traitementApi.getCatalogRaw();
      if (rawCatalog) {
        const normalized = normalizeCatalogPayload(rawCatalog);
        this.applyCatalogState(normalized.catalog, normalized.warnings);
        return;
      }

      const phenomena = await this.traitementApi.listPhenomena();
      const normalized = normalizeCatalogPayload({ phenomena });
      this.applyCatalogState(normalized.catalog, normalized.warnings);
    } catch (e: any) {
      this.phenomenaLoadError = 'Impossible de charger le catalogue de phénomènes';
      // eslint-disable-next-line no-console
      console.error('Failed to load catalog', e);
      this.applyCatalogState({ version: '1.0', phenomena: [] }, ['catalog unavailable']);
    } finally {
      this.isLoadingPhenomena = false;
    }
  }

  private applyCatalogState(catalog: Catalog, warnings: string[]): void {
    this.catalog = catalog;
    this.catalogWarnings = warnings;

    this.availablePhenomena = getPhenomena(catalog).map((p) => ({ id: p.id, name: p.label || p.id }));

    if (!this.availablePhenomena.some((p) => p.id === this.selectedPhenomenonId)) {
      this.selectedPhenomenonId = this.availablePhenomena[0]?.id ?? '';
    }

    this.pushCatalogToMap();
  }

  private pushCatalogToMap(): void {
    const mapComp: any = this.mapComponent;
    if (!mapComp) return;

    if (typeof mapComp.setCatalog === 'function') {
      mapComp.setCatalog(this.catalog);
    }
    if (this.selectedPhenomenonId && typeof mapComp.setPhenomenon === 'function') {
      mapComp.setPhenomenon(this.selectedPhenomenonId);
    }
  }

  onPhenomenonChange(): void {
    this.pipelineContext = undefined;
    this.lastRunError = undefined;
    this.mapComponent?.setPhenomenon?.(this.selectedPhenomenonId);
  }

  private getAoiGeoJsonForRun(): any {
    if (this.aoiMode === 'drawn' && this.drawnAoiGeoJson) return this.drawnAoiGeoJson;
    const viewport = this.mapComponent?.getViewportAoiGeoJson?.();
    if (viewport) return viewport;
    return {
      type: 'Polygon',
      coordinates: [
        [
          [-17.65, 14.55],
          [-17.15, 14.55],
          [-17.15, 14.85],
          [-17.65, 14.85],
          [-17.65, 14.55],
        ],
      ],
    };
  }

  startDrawAoi(): void {
    const map = this.mapComponent?.getMap;
    if (!map) return;

    this.aoiMode = 'drawn';
    this.drawnAoiGeoJson = undefined;

    this.mapUtils.startDrawing(map, { type: 'Polygon', strokeColor: '#2563EB', fillColor: '#2563EB' }, (feature) => {
      const geom = this.mapUtils.featureToGeoJsonGeometry(feature);
      this.drawnAoiGeoJson = geom;
      this.mapUtils.stopDrawing(map);
    });
  }

  clearDrawnAoi(): void {
    const map = this.mapComponent?.getMap;
    if (map) this.mapUtils.stopDrawing(map);
    this.drawnAoiGeoJson = undefined;
    this.mapUtils.clear();
  }

  async runPipeline(): Promise<void> {
    this.isRunning = true;
    this.lastRunError = undefined;

    try {
      const aoi = this.getAoiGeoJsonForRun();
      const payload = this.buildRunPayload(aoi);
      this.logFinalPayloadForDev(payload);

      const ctx = await this.traitementApi.run(payload);
      this.pipelineContext = ctx;

      const maybeCatalog = (ctx as any)?.catalog ?? (ctx as any)?.metrics?.catalog ?? (ctx as any)?.metrics?.publish_pack?.catalog;
      if (maybeCatalog) {
        const normalized = normalizeCatalogPayload(maybeCatalog);
        if (normalized.catalog.phenomena.length > 0) {
          this.applyCatalogState(normalized.catalog, normalized.warnings);
        }
      }

      this.mapComponent?.applyTraitementContext?.(ctx);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erreur lors du lancement du pipeline:', error);
      this.lastRunError = 'Erreur lors du lancement du pipeline';
    } finally {
      this.isRunning = false;
    }
  }

  private buildRunPayload(aoi: any): TraitementRunRequest {
    const phenomenon = this.normalizePhenomenon(this.selectedPhenomenonId) || this.availablePhenomena[0]?.id || 'unknown';

    return buildTraitementRunPayload({
      aoiGeojson: aoi,
      date1: this.dateRange.start,
      date2: this.dateRange.end,
      phenomenon,
      indicators: this.selectedIndicators,
      sensorHint: 'AUTO',
      providerHint: 'AUTO',
      region: 'AFRICA',
    });
  }

  private logFinalPayloadForDev(payload: TraitementRunRequest): void {
    if (!isDevMode()) return;
    // eslint-disable-next-line no-console
    console.debug('[traitement/run payload]', {
      phenomenon: payload.phenomenon,
      sensor_hint: payload.sensor_hint ?? null,
      indicators: payload.indicators ?? null,
    });
  }

  private normalizePhenomenon(value: string): string {
    return (value || '').trim().toLowerCase();
  }

  private toFrNumberString(raw: string): string {
    const s = (raw || '').trim();
    if (!/^\d+(\.\d+)?$/.test(s)) return s;
    return s.replace('.', ',');
  }

  private translateBackendMessage(message: string): string {
    const msg = (message || '').trim();
    if (!msg) return msg;

    {
      const m = msg.match(/^Valid ratio too low \(([\d.]+) < ([\d.]+)\)$/);
      if (m) return `Taux de pixels valides trop faible (${this.toFrNumberString(m[1])} < ${this.toFrNumberString(m[2])})`;
    }
    {
      const m = msg.match(/^Confidence too low \(([\d.]+) < ([\d.]+)\)$/);
      if (m) return `Confiance trop faible (${this.toFrNumberString(m[1])} < ${this.toFrNumberString(m[2])})`;
    }
    {
      const m = msg.match(/^date([12]) coverage low \(([\d.]+) < ([\d.]+)\)$/);
      if (m) return `Couverture AOI insuffisante (date ${m[1]}) (${this.toFrNumberString(m[2])} < ${this.toFrNumberString(m[3])})`;
    }
    {
      const m = msg.match(/^coverage below threshold after all attempts \(best=([\d.]+) < ([\d.]+)\)$/);
      if (m) return `Couverture AOI insuffisante après tous les essais (meilleur=${this.toFrNumberString(m[1])} < ${this.toFrNumberString(m[2])})`;
    }
    {
      const m = msg.match(/^(acquisition|preprocess|indices|change|validation|publish_pack) failed: HTTP (\d{3})$/);
      if (m) return `Étape « ${this.formatStepName(m[1])} » en échec (HTTP ${m[2]})`;
    }

    return msg;
  }

  formatRunStatus(status?: string): string {
    switch ((status || '').toUpperCase()) {
      case 'CREATED':
        return 'Créé';
      case 'RUNNING':
        return 'En cours';
      case 'DONE':
        return 'Terminé';
      case 'FAILED':
        return 'Échec';
      default:
        return status || '';
    }
  }

  formatStepState(state?: string): string {
    switch ((state || '').toUpperCase()) {
      case 'PENDING':
        return 'En attente';
      case 'RUNNING':
        return 'En cours';
      case 'DONE':
        return 'Terminé';
      case 'FAILED':
        return 'Échec';
      case 'SKIPPED':
        return 'Ignoré';
      default:
        return state || '';
    }
  }

  formatStepName(step?: string): string {
    switch ((step || '').trim()) {
      case 'acquisition':
        return 'Acquisition';
      case 'preprocess':
        return 'Prétraitement';
      case 'indices':
        return 'Indices';
      case 'change':
        return 'Changement';
      case 'validation':
        return 'Validation';
      case 'publish_pack':
        return 'Publication';
      default:
        return step || '';
    }
  }

  get warningsSummary(): Array<{ text: string; count: number }> {
    const warnings = this.pipelineContext?.warnings ?? [];
    const counts = new Map<string, number>();
    for (const w of warnings) {
      const key = String(w || '').trim();
      if (!key) continue;
      const fr = this.translateBackendMessage(key);
      counts.set(fr, (counts.get(fr) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([text, count]) => ({ text, count }));
  }

  get errorsSummary(): Array<{ text: string; count: number }> {
    const errors = this.pipelineContext?.errors ?? [];
    const counts = new Map<string, number>();
    for (const e of errors) {
      const key = String(e || '').trim();
      if (!key) continue;
      const fr = this.translateBackendMessage(key);
      counts.set(fr, (counts.get(fr) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([text, count]) => ({ text, count }));
  }

  get failedStepDetail(): { step: string; statusCode?: number; responseExcerpt?: string } | null {
    const ctx: any = this.pipelineContext;
    const steps = ctx?.metrics?.orchestrator?.steps;
    if (!Array.isArray(steps)) return null;

    const failed = steps.find((s: any) => s && s.ok === false) ?? null;
    if (!failed?.step) return null;

    return {
      step: String(failed.step),
      statusCode: typeof failed.status_code === 'number' ? failed.status_code : undefined,
      responseExcerpt: typeof failed.response_excerpt === 'string' ? failed.response_excerpt : undefined,
    };
  }

  get availableLayers() {
    return this.mapComponent?.getAvailableLayers || [];
  }

  get compareOptions() {
    return this.mapComponent?.getCompareOptions || [];
  }

  get selectedLayerId(): string {
    return this.mapComponent?.getSelectedLayerId || '';
  }

  set selectedLayerId(id: string) {
    if (this.mapComponent) {
      this.mapComponent.setSelectedLayerId = id;
    }
  }

  get wmsVisible(): boolean {
    return this.mapComponent?.getWmsVisible ?? true;
  }

  set wmsVisible(visible: boolean) {
    if (this.mapComponent) {
      this.mapComponent.setWmsVisible = visible;
    }
  }

  get wmsOpacity(): number {
    return this.mapComponent?.getWmsOpacity ?? 0.8;
  }

  set wmsOpacity(opacity: number) {
    if (this.mapComponent) {
      this.mapComponent.setWmsOpacity = opacity;
    }
  }

  get compareEnabled(): boolean {
    return this.mapComponent?.getCompareEnabled ?? false;
  }

  set compareEnabled(enabled: boolean) {
    if (this.mapComponent) {
      this.mapComponent.setCompareEnabled = enabled;
    }
  }

  get compareIndex(): string {
    return this.mapComponent?.getCompareIndex ?? '';
  }

  set compareIndex(index: string) {
    if (this.mapComponent) {
      this.mapComponent.setCompareIndex = index;
    }
  }

  get selectedIndicatorInfo() {
    return this.mapComponent?.getSelectedIndicatorInfo || { name: '', measure: '', typicalRange: '', quickRead: [] };
  }

  get dateLabels() {
    return this.mapComponent?.getDateLabels || {
      date1Label: 'Unknown date',
      date2Label: 'Unknown date',
      metadataStatus: 'missing',
      warning: 'Temporal metadata unavailable',
    };
  }

  get legendMetadata() {
    return this.mapComponent?.getLegendMetadata;
  }

  get legendUrl(): string {
    return this.mapComponent?.getLegendUrl || '';
  }

  get legendExpanded(): boolean {
    return this.mapComponent?.getLegendExpanded ?? false;
  }

  get lastFeatureInfo(): string | undefined {
    return this.mapComponent?.getLastFeatureInfo;
  }

  onWmsToggle(): void {
    console.log('WMS visibility toggled');
  }

  onLayerChange(): void {
    console.log('Layer changed:', this.selectedLayerId);
  }

  onOpacityChange(): void {
    console.log('Opacity changed:', this.wmsOpacity);
  }

  onCompareToggle(): void {
    console.log('Compare toggled:', this.compareEnabled);
  }

  onCompareIndexChange(): void {
    console.log('Compare index changed:', this.compareIndex);
  }

  zoomToLayer(): void {
    this.mapComponent?.onZoomToData?.();
  }

  toggleLegend(): void {
    this.mapComponent?.toggleLegend?.();
  }

  exportMapImage(format: 'png' | 'tiff' = 'png'): void {
    const map = this.mapComponent?.getMap;
    if (!map) return;

    try {
      if (format === 'png') {
        this.mapUtils.exportMapAsPng(map, 'carte-satellite.png');
      } else if (format === 'tiff') {
        this.mapUtils.exportMapAsTiff(map, 'carte-satellite.tiff');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export de la carte');
    }
  }

  exportMapAsGeoJSON(): void {
    try {
      const geoJson = this.mapUtils.exportAsGeoJson();
      this.downloadFile(geoJson, 'carte-satellite.geojson', 'application/geo+json');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export GeoJSON');
    }
  }

  exportPipelineContext(): void {
    if (!this.pipelineContext) {
      alert('Aucune exécution disponible');
      return;
    }
    this.downloadFile(JSON.stringify(this.pipelineContext, null, 2), `pipeline-${this.pipelineContext.run_id}.json`, 'application/json');
  }

  exportAoiGeoJson(): void {
    const aoi = this.getAoiGeoJsonForRun();
    this.downloadFile(
      JSON.stringify({ type: 'Feature', geometry: aoi, properties: { source: this.aoiMode } }, null, 2),
      'aoi.geojson',
      'application/geo+json',
    );
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
