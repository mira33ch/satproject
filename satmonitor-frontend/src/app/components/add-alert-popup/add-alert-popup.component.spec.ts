import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAlertPopupComponent } from './add-alert-popup.component';

describe('AddAlertPopupComponent', () => {
  let component: AddAlertPopupComponent;
  let fixture: ComponentFixture<AddAlertPopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddAlertPopupComponent]
    });
    fixture = TestBed.createComponent(AddAlertPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
