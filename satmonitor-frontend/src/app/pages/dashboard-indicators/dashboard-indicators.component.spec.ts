import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardIndicatorsComponent } from './dashboard-indicators.component';

describe('DashboardIndicatorsComponent', () => {
  let component: DashboardIndicatorsComponent;
  let fixture: ComponentFixture<DashboardIndicatorsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardIndicatorsComponent]
    });
    fixture = TestBed.createComponent(DashboardIndicatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
