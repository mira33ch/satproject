import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmModalComponent } from './sm-modal.component';

describe('SmModalComponent', () => {
  let component: SmModalComponent;
  let fixture: ComponentFixture<SmModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SmModalComponent]
    });
    fixture = TestBed.createComponent(SmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
