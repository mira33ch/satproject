import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmEmailPageComponentComponent } from './confirm-email-page-component.component';

describe('ConfirmEmailPageComponentComponent', () => {
  let component: ConfirmEmailPageComponentComponent;
  let fixture: ComponentFixture<ConfirmEmailPageComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmEmailPageComponentComponent]
    });
    fixture = TestBed.createComponent(ConfirmEmailPageComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
