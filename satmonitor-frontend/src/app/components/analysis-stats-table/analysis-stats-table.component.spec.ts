import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisStatsTableComponent } from './analysis-stats-table.component';

describe('AnalysisStatsTableComponent', () => {
  let component: AnalysisStatsTableComponent;
  let fixture: ComponentFixture<AnalysisStatsTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AnalysisStatsTableComponent]
    });
    fixture = TestBed.createComponent(AnalysisStatsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
