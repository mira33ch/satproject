import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisAreaChartComponent } from './analysis-area-chart.component';

describe('AnalysisAreaChartComponent', () => {
  let component: AnalysisAreaChartComponent;
  let fixture: ComponentFixture<AnalysisAreaChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AnalysisAreaChartComponent]
    });
    fixture = TestBed.createComponent(AnalysisAreaChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
