import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { DashboardMapComponent } from './dashboard-map.component';
import { TraitementApiService } from './traitement-api.service';
import type { TraitementRunRequest } from './traitement-api.models';

describe('DashboardMapComponent', () => {
  let component: DashboardMapComponent;
  let fixture: ComponentFixture<DashboardMapComponent>;
  let runSpy: jasmine.Spy;
  let listPhenomenaSpy: jasmine.Spy;
  let getCatalogRawSpy: jasmine.Spy;

  beforeEach(() => {
    getCatalogRawSpy = jasmine.createSpy('getCatalogRaw').and.resolveTo({
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
              layers: {
                t1: 'satmonitor:flood_mndwi_t1',
                t2: 'satmonitor:flood_mndwi_t2',
              },
            },
          ],
        },
      ],
    });

    listPhenomenaSpy = jasmine.createSpy('listPhenomena').and.resolveTo({
      flood: 'Flood',
    });

    runSpy = jasmine.createSpy('run').and.resolveTo({
      run_id: 'run-1',
      aoi: {},
      date1: '2025-01-01',
      date2: '2025-01-02',
      sensor: 'S1',
      phenomenon: 'flood',
      indicators: ['mndwi'],
      region: 'AFRICA',
      durations: {},
      step_status: {},
      raw_files: [],
      processed_files: [],
      products: [],
      metrics: {},
      warnings: [],
      errors: [],
      status: 'DONE',
    });

    TestBed.configureTestingModule({
      declarations: [DashboardMapComponent],
      imports: [RouterTestingModule, FormsModule],
      providers: [
        {
          provide: TraitementApiService,
          useValue: {
            getCatalogRaw: getCatalogRawSpy,
            listPhenomena: listPhenomenaSpy,
            run: runSpy,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(DashboardMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads enabled phenomena from catalog', async () => {
    await component.loadCatalog();
    expect(component.availablePhenomena.map((p) => p.id)).toEqual(['flood']);
    expect(component.selectedPhenomenonId).toBe('flood');
  });

  it('builds generic payload without phenomenon-specific branches', async () => {
    await component.loadCatalog();
    component.selectedPhenomenonId = 'flood';
    component.selectedIndicators = ['mndwi'];

    await component.runPipeline();

    expect(runSpy).toHaveBeenCalled();
    const payload = runSpy.calls.mostRecent().args[0] as TraitementRunRequest;
    expect(payload.phenomenon).toBe('flood');
    expect(payload.indicators).toEqual(['mndwi']);
    expect(payload.sensor_hint).toBe('AUTO');
  });
});
