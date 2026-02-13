import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterPopupComponent } from './register-popup.component';

describe('RegisterPopupComponent', () => {
  let component: RegisterPopupComponent;
  let fixture: ComponentFixture<RegisterPopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegisterPopupComponent]
    });
    fixture = TestBed.createComponent(RegisterPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
