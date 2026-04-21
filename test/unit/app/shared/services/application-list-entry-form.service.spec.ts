import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { EntryGetDetailDto } from '@openapi';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';

describe('ApplicationListEntryFormService', () => {
  let service: ApplicationListEntryFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [ApplicationListEntryFormService],
    });

    service = TestBed.inject(ApplicationListEntryFormService);
  });

  it('creates a respondent person form with dob control without adding dob to applicant person form', () => {
    const forms = service.createForms();

    expect('dob' in forms.personForm.controls).toBe(false);
    expect('dob' in forms.respondentPersonForm.controls).toBe(true);
    expect(forms.respondentPersonForm.getRawValue()).toMatchObject({
      dob: null,
    });
  });

  it('hydrates respondent person dob from dto and leaves the form clean', () => {
    const forms = service.createForms();

    forms.respondentPersonForm.markAsDirty();

    service.hydrateFromDto(
      {
        applicationCode: 'APP-100',
        lodgementDate: '2026-04-20',
        respondent: {
          person: {
            name: {
              firstForename: 'Jane',
              surname: 'Doe',
            },
            dateOfBirth: '1990-02-03',
            contactDetails: {
              addressLine1: '1 Street',
            },
          },
        },
      } as EntryGetDetailDto,
      forms,
    );

    expect(forms.form.controls.respondentEntryType.value).toBe('person');
    expect(forms.respondentPersonForm.getRawValue()).toMatchObject({
      firstName: 'Jane',
      surname: 'Doe',
      dob: '1990-02-03',
    });
    expect(forms.respondentPersonForm.dirty).toBe(false);
  });

  it('defaults respondent entry type to person when dto has no respondent', () => {
    const forms = service.createForms();

    forms.form.controls.respondentEntryType.setValue('organisation');

    service.hydrateFromDto(
      {
        applicationCode: 'APP-100',
        lodgementDate: '2026-04-20',
        respondent: null,
      } as unknown as EntryGetDetailDto,
      forms,
    );

    expect(forms.form.controls.respondentEntryType.value).toBe('person');
    expect(forms.respondentPersonForm.getRawValue()).toMatchObject({
      firstName: '',
      surname: null,
      dob: null,
      addressLine1: '',
    });
    expect(forms.respondentOrganisationForm.getRawValue()).toMatchObject({
      name: '',
      addressLine1: '',
    });
    expect(forms.respondentPersonForm.dirty).toBe(false);
    expect(forms.respondentOrganisationForm.dirty).toBe(false);
  });
});
