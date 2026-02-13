import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportParametersFormComponent } from './report-parameters-form.component';

describe('ReportParametersFormComponent', () => {
  let component: ReportParametersFormComponent;
  let fixture: ComponentFixture<ReportParametersFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportParametersFormComponent]
    });
    fixture = TestBed.createComponent(ReportParametersFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
