import { FormControl, FormGroup } from '@angular/forms';
import {
  mapPPIFormToParams,
  mapPPIRequestParams,
} from '@app/pages/reports/util';

describe('report-request.mapper PPI helpers', () => {
  it('mapPPIFormToParams trims values and maps location fields', () => {
    const form = new FormGroup({
      dateFrom: new FormControl('2026-01-01'),
      dateTo: new FormControl('2026-01-31'),
      applicantOrg: new FormControl('  Org Ltd  '),
      applicantFirst: new FormControl('  Jane  '),
      applicantLast: new FormControl('  Smith  '),
      standardApplicantName: new FormControl('  Standard  '),
      respondentFirst: new FormControl('  John  '),
      respondentSurname: new FormControl('  Doe  '),
      respondentOrg: new FormControl('  Resp Org  '),
      court: new FormControl(' A1 '),
      otherLocation: new FormControl(''),
      cja: new FormControl(''),
    });

    expect(mapPPIFormToParams(form)).toEqual({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      applicantOrganisationName: 'Org Ltd',
      applicantFirstName: 'Jane',
      applicantSurname: 'Smith',
      standardApplicantName: 'Standard',
      respondentFirstName: 'John',
      respondentSurname: 'Doe',
      respondentOrganisationName: 'Resp Org',
      location: {
        courtLocationCode: 'A1',
      },
    });
  });

  it('mapPPIRequestParams wraps the mapped filter dto', () => {
    const form = new FormGroup({
      dateFrom: new FormControl('2026-01-01'),
      dateTo: new FormControl('2026-01-31'),
      applicantOrg: new FormControl(''),
      applicantFirst: new FormControl(''),
      applicantLast: new FormControl(''),
      standardApplicantName: new FormControl(''),
      respondentFirst: new FormControl(''),
      respondentSurname: new FormControl(''),
      respondentOrg: new FormControl(''),
      court: new FormControl(''),
      otherLocation: new FormControl('Annex'),
      cja: new FormControl('C1'),
    });

    expect(mapPPIRequestParams(form)).toEqual({
      privateProsecutorsIndexFilterDto: {
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        location: {
          otherLocationDescription: 'Annex',
          cjaCode: 'C1',
        },
      },
    });
  });
});
