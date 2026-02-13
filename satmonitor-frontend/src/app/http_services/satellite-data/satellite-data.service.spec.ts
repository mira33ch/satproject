import { TestBed } from '@angular/core/testing';

import { SatelliteDataService } from './satellite-data.service';

describe('SatelliteDataService', () => {
  let service: SatelliteDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SatelliteDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
