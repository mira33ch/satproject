import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { SatMapComponent } from './sat-map.component';
import { normalizeCatalogPayload } from 'src/domain/catalog/adapter';

describe('SatMapComponent', () => {
  let component: SatMapComponent;
  let fixture: ComponentFixture<SatMapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SatMapComponent],
      imports: [FormsModule, HttpClientTestingModule],
    });
    fixture = TestBed.createComponent(SatMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('phenomenon switch updates layer dropdown dynamically from catalog', () => {
    const normalized = normalizeCatalogPayload({
      version: '1.0',
      phenomena: [
        {
          id: 'deforestation',
          label: 'Deforestation',
          enabled: true,
          dates: { t1: '2024-01-01', t2: '2024-02-01' },
          products: [
            {
              id: 'ndvi',
              label: 'NDVI',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              layers: { t1: 'ws:defor_ndvi_t1', t2: 'ws:defor_ndvi_t2' },
            },
          ],
        },
        {
          id: 'flood',
          label: 'Flood',
          enabled: true,
          dates: { t1: '2024-09-10', t2: '2024-10-18' },
          products: [
            {
              id: 'mndwi',
              label: 'MNDWI',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              layers: { t1: 'ws:flood_mndwi_t1', t2: 'ws:flood_mndwi_t2', delta: 'ws:flood_delta_mndwi' },
            },
          ],
        },
      ],
    });

    component.setCatalog(normalized.catalog);
    component.setPhenomenon('deforestation');
    const deforLabels = component.getAvailableLayers.map((x) => x.label);

    component.setPhenomenon('flood');
    const floodLabels = component.getAvailableLayers.map((x) => x.label);

    expect(deforLabels.some((label) => label.includes('NDVI'))).toBeTrue();
    expect(floodLabels.some((label) => label.includes('MNDWI'))).toBeTrue();
    expect(floodLabels.some((label) => label.includes('NDVI'))).toBeFalse();
  });

  it('compare dropdown updates dynamically from compare-capable products', () => {
    const normalized = normalizeCatalogPayload({
      version: '1.0',
      phenomena: [
        {
          id: 'wildfire',
          label: 'Wildfire',
          enabled: true,
          dates: { t1: '2024-07-01', t2: '2024-08-01' },
          products: [
            {
              id: 'burn_index',
              label: 'Burn Index',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              layers: { t1: 'ws:burn_t1', t2: 'ws:burn_t2' },
            },
            {
              id: 'smoke_mask',
              label: 'Smoke Mask',
              kind: 'binary_mask',
              compare_capable: false,
              enabled: true,
              layers: { final: 'ws:smoke_final' },
            },
          ],
        },
      ],
    });

    component.setCatalog(normalized.catalog);
    component.setPhenomenon('wildfire');

    const compare = component.getCompareOptions;
    expect(compare).toEqual([{ id: 'burn_index', label: 'Burn Index (2024-07-01 ↔ 2024-08-01)' }]);
  });

  it('dates panel shows real t1/t2 from selected phenomenon', async () => {
    const normalized = normalizeCatalogPayload({
      version: '1.0',
      phenomena: [
        {
          id: 'flood',
          label: 'Flood',
          enabled: true,
          dates: { t1: '2024-09-10', t2: '2024-10-18' },
          products: [
            {
              id: 'mndwi',
              label: 'MNDWI',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              layers: { t1: 'ws:mndwi_t1', t2: 'ws:mndwi_t2' },
            },
          ],
        },
      ],
    });

    component.setCatalog(normalized.catalog);
    component.setPhenomenon('flood');

    const labels = await (component as any).computeDateLabelsForCurrentSelection();
    expect(labels.date1Label).toBe('2024-09-10');
    expect(labels.metadataStatus).toBe('ok');
    expect(component.getAvailableLayers.some((x) => /date1|date2/i.test(x.label))).toBeFalse();
  });

  it('missing dates show Unknown date warning state', async () => {
    const normalized = normalizeCatalogPayload({
      version: '1.0',
      phenomena: [
        {
          id: 'flood',
          label: 'Flood',
          enabled: true,
          metadata_status: 'missing',
          metadata_reason: 'manifest unavailable',
          dates: { t1: null, t2: null },
          products: [
            {
              id: 'mndwi',
              label: 'MNDWI',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              layers: { t1: 'ws:mndwi_t1', t2: 'ws:mndwi_t2' },
              metadata_status: 'missing',
              metadata_reason: 'manifest unavailable',
            },
          ],
        },
      ],
    });

    component.setCatalog(normalized.catalog);
    component.setPhenomenon('flood');

    const labels = await (component as any).computeDateLabelsForCurrentSelection();
    expect(labels.metadataStatus).toBe('missing');
    expect(labels.date1Label).toBe('Unknown date');
    expect(labels.warning).toContain('manifest unavailable');
  });

  it('renders unknown new phenomenon without code changes', () => {
    const normalized = normalizeCatalogPayload({
      version: '1.0',
      phenomena: [
        {
          id: 'wildfire',
          label: 'Wildfire',
          enabled: true,
          dates: { t1: '2024-07-01', t2: '2024-08-01' },
          products: [
            {
              id: 'hotspot_score',
              label: 'Hotspot Score',
              kind: 'delta',
              compare_capable: false,
              enabled: true,
              layers: { delta: 'ws:wildfire_delta_hotspot' },
            },
          ],
        },
      ],
    });

    component.setCatalog(normalized.catalog);
    component.setPhenomenon('wildfire');

    const labels = component.getAvailableLayers.map((x) => x.label);
    expect(labels).toEqual(['Hotspot Score (2024-07-01 → 2024-08-01)']);
  });

  it('prefers LatLonBoundingBox over non-3857 BoundingBox when fitting WMS layers', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<WMT_MS_Capabilities version="1.1.0">
  <Capability>
    <Layer>
      <Name>satmonitor:flood_mndwi_date1</Name>
      <BoundingBox SRS="EPSG:32634" minx="-1996998.0" miny="4212848.0" maxx="-1974048.0" maxy="4233022.0" />
      <LatLonBoundingBox minx="-6.1597" miny="35.1426" maxx="-6.0815" maxy="35.1873" />
    </Layer>
  </Capability>
</WMT_MS_Capabilities>`;

    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const resolved = (component as any).findLayerBbox(doc, 'satmonitor:flood_mndwi_date1', 'EPSG:3857');
    expect(resolved?.source).toBe('LatLonBoundingBox');
  });

  it('regression: selectors/render paths remain catalog-driven for arbitrary ids', () => {
    const normalized = normalizeCatalogPayload({
      version: '1.0',
      phenomena: [
        {
          id: 'phenomenon_x',
          label: 'Phenomenon X',
          enabled: true,
          dates: { t1: '2026-01-01', t2: '2026-01-15' },
          products: [
            {
              id: 'metric_alpha',
              label: 'Metric Alpha',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              layers: { t1: 'ws:metric_alpha_t1', t2: 'ws:metric_alpha_t2' },
            },
          ],
        },
      ],
    });

    component.setCatalog(normalized.catalog);
    component.setPhenomenon('phenomenon_x');

    expect(component.getAvailableLayers.map((x) => x.id)).toContain('metric_alpha:t1');
    expect(component.getCompareOptions.map((x) => x.id)).toEqual(['metric_alpha']);
    expect(component.getCompareOptions[0].label).toContain('2026-01-01');
  });

  it('findLayerBbox matches unqualified name against qualified capabilities layer', () => {
    const xml = `
      <WMT_MS_Capabilities version="1.1.0">
        <Capability>
          <Layer>
            <Layer>
              <Name>satmonitor:flood_mndwi_date1</Name>
              <LatLonBoundingBox minx="-6.02" miny="34.92" maxx="-5.81" maxy="35.07" />
            </Layer>
          </Layer>
        </Capability>
      </WMT_MS_Capabilities>`;
    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    const resolved = (component as any).findLayerBbox(doc, 'flood_mndwi_date1', 'EPSG:3857');
    expect(resolved).not.toBeNull();
    expect(resolved.source).toBe('LatLonBoundingBox');
    expect(resolved.extent[0]).toBeLessThan(resolved.extent[2]);
    expect(resolved.extent[1]).toBeLessThan(resolved.extent[3]);
  });

  it('getCapabilitiesDoc supports force refresh after cache hit', async () => {
    const xml = `<WMT_MS_Capabilities version="1.1.0"><Capability><Layer /></Capability></WMT_MS_Capabilities>`;
    const httpGetSpy = spyOn((component as any).http, 'get').and.returnValue(of(xml));

    await (component as any).getCapabilitiesDoc();
    await (component as any).getCapabilitiesDoc();
    expect(httpGetSpy).toHaveBeenCalledTimes(1);

    await (component as any).getCapabilitiesDoc({ forceRefresh: true });
    expect(httpGetSpy).toHaveBeenCalledTimes(2);
  });

  it('zoom prefers capabilities bbox over catalog bbox_wgs84 when available', async () => {
    const normalized = normalizeCatalogPayload({
      version: '1.0',
      phenomena: [
        {
          id: 'flood',
          label: 'Flood',
          enabled: true,
          dates: { t1: '2024-09-10', t2: '2024-10-18' },
          products: [
            {
              id: 'mndwi',
              label: 'MNDWI',
              kind: 'index',
              compare_capable: true,
              enabled: true,
              bbox_wgs84: [-6.1, 34.9, -5.7, 35.1],
              layers: { t1: 'ws:mndwi_t1', t2: 'ws:mndwi_t2', delta: 'ws:delta_mndwi' },
            },
          ],
        },
      ],
    });

    component.setCatalog(normalized.catalog);
    component.setPhenomenon('flood');
    component.selectedLayerId = component.getAvailableLayers[0].id;

    const fitSpy = jasmine.createSpy('fit');
    const viewStub: any = { fit: fitSpy, setCenter: () => {}, setZoom: () => {} };
    (component as any).map = { getView: () => viewStub, setTarget: () => {} };

    const xml = `
      <WMT_MS_Capabilities version="1.1.0">
        <Capability>
          <Layer>
            <Layer>
              <Name>ws:mndwi_t1</Name>
              <LatLonBoundingBox minx="-2.80" miny="5.40" maxx="-2.40" maxy="5.70" />
            </Layer>
          </Layer>
        </Capability>
      </WMT_MS_Capabilities>`;
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const capsSpy = spyOn(component as any, 'getCapabilitiesDoc').and.resolveTo(doc);
    await component.fitToSelectedLayerExtent();

    expect(capsSpy).toHaveBeenCalled();
    expect(fitSpy).toHaveBeenCalled();
    const fittedExtent = fitSpy.calls.mostRecent().args[0] as [number, number, number, number];
    expect(fittedExtent[1]).toBeLessThan(1_500_000);
  });
});
