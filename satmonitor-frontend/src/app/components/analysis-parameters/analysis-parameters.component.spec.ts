import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisParametersComponent } from './analysis-parameters.component';

describe('AnalysisParametersComponent', () => {
  let component: AnalysisParametersComponent;
  let fixture: ComponentFixture<AnalysisParametersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AnalysisParametersComponent]
    });
    fixture = TestBed.createComponent(AnalysisParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
