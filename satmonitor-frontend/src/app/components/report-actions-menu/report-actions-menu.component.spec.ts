import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportActionsMenuComponent } from './report-actions-menu.component';

describe('ReportActionsMenuComponent', () => {
  let component: ReportActionsMenuComponent;
  let fixture: ComponentFixture<ReportActionsMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportActionsMenuComponent]
    });
    fixture = TestBed.createComponent(ReportActionsMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
