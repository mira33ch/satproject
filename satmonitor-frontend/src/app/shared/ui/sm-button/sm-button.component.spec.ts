import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmButtonComponent } from './sm-button.component';

describe('SmButtonComponent', () => {
  let component: SmButtonComponent;
  let fixture: ComponentFixture<SmButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SmButtonComponent]
    });
    fixture = TestBed.createComponent(SmButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
