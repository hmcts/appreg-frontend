import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';

import { StandardApplicantsViewComponent } from '@components/standard-applicants/standard-applicants-view/standard-applicants-view.component';
import {
  Applicant,
  StandardApplicantGetDetailDto,
  StandardApplicantsApi,
} from '@openapi';

describe('StandardApplicantsViewComponent', () => {
  let component!: StandardApplicantsViewComponent;
  let fixture!: ComponentFixture<StandardApplicantsViewComponent>;

  const getStandardApplicantByCodeMock = jest.fn();

  const apiStub: Pick<StandardApplicantsApi, 'getStandardApplicantByCode'> = {
    getStandardApplicantByCode: getStandardApplicantByCodeMock,
  };

  const routeStub: Partial<ActivatedRoute> = {
    snapshot: {
      paramMap: convertToParamMap({ id: 'SA01' }),
    } as ActivatedRoute['snapshot'],
  };

  const createComponent = async (
    response: StandardApplicantGetDetailDto & { applicant?: Applicant },
  ): Promise<void> => {
    getStandardApplicantByCodeMock.mockReset();
    getStandardApplicantByCodeMock.mockReturnValue(of(response));

    await TestBed.configureTestingModule({
      imports: [StandardApplicantsViewComponent],
      providers: [
        provideRouter([]),
        { provide: StandardApplicantsApi, useValue: apiStub },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StandardApplicantsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('displays the new flat response without a nested applicant', async () => {
    await createComponent({
      code: 'SA01',
      name: 'Reference organisation',
      startDate: '2026-01-01',
      endDate: null,
    });

    expect(component.summaryListValues).toEqual({
      standardApplicantName: 'Reference organisation',
      useFrom: '1 Jan 2026',
      useTo: '—',
    });
  });

  it('supports the legacy organisation name without exposing its address', async () => {
    await createComponent({
      code: 'SA01',
      applicant: {
        organisation: {
          name: 'Legacy organisation',
          contactDetails: { addressLine1: 'Synthetic address' },
        },
      },
      startDate: '2026-01-01',
      endDate: null,
    });

    expect(component.summaryListValues.standardApplicantName).toBe(
      'Legacy organisation',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Synthetic address',
    );
  });

  it('should create', async () => {
    await createComponent({
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
    });

    expect(component).toBeTruthy();
  });

  it('displays only the allowed fields despite populated organisation contact details', async () => {
    await createComponent({
      code: 'SA01',
      name: 'Applicant Org',
      applicant: {
        organisation: {
          name: 'Applicant Org',
          contactDetails: {
            addressLine1: '1 Test Street',
            addressLine2: 'Suite 2',
            addressLine3: 'Manchester',
            addressLine4: null,
            addressLine5: null,
            postcode: 'M1 1AA',
            phone: '0161 000 0000',
            mobile: null,
            email: 'org@example.test',
          },
        },
      },
      startDate: '2026-01-01',
      endDate: null,
    });

    expect(component.summaryListValues).toEqual({
      standardApplicantName: 'Applicant Org',
      useFrom: '1 Jan 2026',
      useTo: '—',
    });
  });

  it('does not append a personal title or expose personal contact details', async () => {
    await createComponent({
      code: 'SA02',
      name: 'Alex Taylor',
      applicant: {
        person: {
          name: {
            title: 'Mr',
            firstName: 'Alex',
            lastName: 'Taylor',
          },
          contactDetails: {
            addressLine1: '2 Test Street',
            addressLine2: null,
            addressLine3: 'Leeds',
            addressLine4: null,
            addressLine5: null,
            postcode: 'LS1 1AA',
            phone: '0113 000 0000',
            mobile: '07700 900000',
            email: 'alex@example.test',
          },
        },
      },
      startDate: '2026-02-03',
      endDate: '2026-12-31',
    });

    expect(component.summaryListValues).toEqual({
      standardApplicantName: 'Alex Taylor',
      useFrom: '3 Feb 2026',
      useTo: '31 Dec 2026',
    });
    const element: HTMLElement = fixture.nativeElement;
    expect(
      Array.from(element.querySelectorAll('dt'), (dt) =>
        dt.textContent?.trim(),
      ),
    ).toEqual(['Code', 'Standard applicant name', 'Use from', 'Use to']);
    expect(element.textContent).not.toContain('2 Test Street');
    expect(element.textContent).not.toContain('alex@example.test');
    expect(element.textContent).not.toContain('Mr');
  });
});
