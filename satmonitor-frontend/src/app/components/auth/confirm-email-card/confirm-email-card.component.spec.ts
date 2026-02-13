import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmEmailCardComponent } from './confirm-email-card.component';

describe('ConfirmEmailCardComponent', () => {
  let component: ConfirmEmailCardComponent;
  let fixture: ComponentFixture<ConfirmEmailCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmEmailCardComponent]
    });
    fixture = TestBed.createComponent(ConfirmEmailCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
