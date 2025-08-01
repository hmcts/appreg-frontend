import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeeDetailsComponent } from './fee-details.component';

describe('FeeDetailsComponent', () => {
  let component: FeeDetailsComponent;
  let fixture: ComponentFixture<FeeDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeeDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
