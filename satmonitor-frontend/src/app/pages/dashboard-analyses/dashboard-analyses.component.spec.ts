import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAnalysesComponent } from './dashboard-analyses.component';

describe('DashboardAnalysesComponent', () => {
  let component: DashboardAnalysesComponent;
  let fixture: ComponentFixture<DashboardAnalysesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardAnalysesComponent]
    });
    fixture = TestBed.createComponent(DashboardAnalysesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
