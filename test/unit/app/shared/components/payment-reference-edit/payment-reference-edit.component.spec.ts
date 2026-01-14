import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentReferenceEditComponent } from './payment-reference-edit.component';

describe('PaymentReferenceEditComponent', () => {
  let component: PaymentReferenceEditComponent;
  let fixture: ComponentFixture<PaymentReferenceEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentReferenceEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentReferenceEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
