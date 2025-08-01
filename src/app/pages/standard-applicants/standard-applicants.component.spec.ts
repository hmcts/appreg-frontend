import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandardApplicantsComponent } from './standard-applicants.component';

describe('StandardApplicantsComponent', () => {
  let component: StandardApplicantsComponent;
  let fixture: ComponentFixture<StandardApplicantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandardApplicantsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StandardApplicantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
