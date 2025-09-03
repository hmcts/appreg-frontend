import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateInputComponent } from '../../../../../../src/app/shared/components/date-input/date-input.component';

describe('DateInputComponent', () => {
  let component: DateInputComponent;
  let fixture: ComponentFixture<DateInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DateInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
