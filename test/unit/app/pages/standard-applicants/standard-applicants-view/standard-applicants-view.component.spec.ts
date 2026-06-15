import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandardApplicantsViewComponent } from '@components/standard-applicants/standard-applicants-view/standard-applicants-view.component';

describe('StandardApplicantsViewComponent', () => {
  let component: StandardApplicantsViewComponent;
  let fixture: ComponentFixture<StandardApplicantsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandardApplicantsViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StandardApplicantsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
