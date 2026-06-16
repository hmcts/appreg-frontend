import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';

import { StandardApplicantsViewComponent } from '@components/standard-applicants/standard-applicants-view/standard-applicants-view.component';
import { StandardApplicantsApi } from '@openapi';

describe('StandardApplicantsViewComponent', () => {
  let component: StandardApplicantsViewComponent;
  let fixture: ComponentFixture<StandardApplicantsViewComponent>;

  const apiStub: Pick<StandardApplicantsApi, 'getStandardApplicantByCode'> = {
    getStandardApplicantByCode: jest.fn().mockReturnValue(
      of({
        code: 'SA01',
        name: 'Applicant Org',
        applicant: {
          organisation: {
            name: 'Applicant Org',
            contactDetails: {
              addressLine1: '1 Test Street',
              addressLine2: null,
              addressLine3: null,
              addressLine4: null,
              addressLine5: null,
              postcode: 'M1 1AA',
              phone: null,
              mobile: null,
              email: null,
            },
          },
        },
        startDate: '2026-01-01',
        endDate: null,
      }),
    ) as StandardApplicantsApi['getStandardApplicantByCode'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandardApplicantsViewComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'SA01' }),
            },
          },
        },
        { provide: StandardApplicantsApi, useValue: apiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StandardApplicantsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
