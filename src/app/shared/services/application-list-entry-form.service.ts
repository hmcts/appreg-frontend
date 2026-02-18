import { Injectable, inject } from '@angular/core';
import { FormGroup, NonNullableFormBuilder } from '@angular/forms';

import { buildEntryCreateDto } from '@components/applications-list-entry-create/util/entry-create-mapper';
import {
  buildEntryUpdateDtoFromForm,
  buildOrganisationForm,
  buildPersonForm,
  buildStandardApplicationForm,
  getRespondentEntryType,
  organisationToFormPatch,
  personToFormPatch,
} from '@components/applications-list-entry-detail/util/entry-detail.form';
import { CivilFeeForm } from '@components/civil-fee-section/civil-fee-section.component';
import {
  Applicant,
  EntryCreateDto,
  EntryGetDetailDto,
  EntryUpdateDto,
  Organisation,
  Person,
} from '@openapi';
import {
  ApplicantType,
  ApplicationListEntryForms,
  ApplicationsListEntryForm,
  ApplicationsListEntryFormValue,
} from '@shared-types/applications-list-entry-create/application-list-entry-form';
import {
  createEmptyOrganisation,
  createEmptyPerson,
} from '@util/applicant-helpers';
import { markFormGroupClean } from '@util/form-helpers';

type HydrateOptions = {
  /** Default false: avoid triggering applicantType valueChanges etc. */
  emitEvent?: boolean;
  /// Optional patches to apply to main form after hydration
  patches?: Partial<{ [K in keyof ApplicationsListEntryForm]: unknown }>;
};

type HydrateResult = {
  applicantType: ApplicantType;
  selectedStandardApplicantCode: string | null;
};

@Injectable({ providedIn: 'root' })
export class ApplicationListEntryFormService {
  private readonly fb = inject(NonNullableFormBuilder);

  private readonly emptyPerson: Person = createEmptyPerson();
  private readonly emptyOrganisation: Organisation = createEmptyOrganisation();

  createForms(): ApplicationListEntryForms {
    return {
      form: buildStandardApplicationForm(this.fb),
      personForm: buildPersonForm(this.fb),
      organisationForm: buildOrganisationForm(this.fb),
      respondentPersonForm: buildPersonForm(this.fb),
      respondentOrganisationForm: buildOrganisationForm(this.fb),
    };
  }

  createCivilFeeForm(forms: ApplicationListEntryForms): CivilFeeForm {
    const c = forms.form.controls;

    return new FormGroup({
      hasOffsiteFee: c.hasOffsiteFee,
      feeStatus: c.feeStatus,
      feeStatusDate: c.feeStatusDate,
      paymentRef: c.paymentRef,
      feeStatuses: c.feeStatuses,
    });
  }

  /**
   * Hydrate main + subforms from server DTO.
   * Also normalises applicantType/standardApplicantCode/subform resets.
   */
  hydrateFromDto(
    dto: EntryGetDetailDto,
    forms: ApplicationListEntryForms,
    opts: HydrateOptions = {},
  ): HydrateResult {
    const emitEvent = opts.emitEvent === true;

    // Patch the shared fields that the create/update mappers care about
    forms.form.patchValue(
      {
        lodgementDate: dto.lodgementDate ?? null,
        applicationCode: dto.applicationCode ?? null,
        respondent: dto.respondent ?? null,
        numberOfRespondents: dto.numberOfRespondents ?? null,
        wordingFields: dto.wordingFields ?? null,
        feeStatuses: dto.feeStatuses ?? null,
        hasOffsiteFee: dto.hasOffsiteFee ?? null,
        applicationNotes: {
          notes: dto.notes ?? null,
          caseReference: dto.caseReference ?? null,
          accountReference: dto.accountNumber ?? null,
        },
      },
      { emitEvent },
    );

    this.hydrateRespondentFromDto(dto, forms, emitEvent);

    // Prefer standard applicant if present
    const standardCode = (dto.standardApplicantCode ?? '').toString().trim();
    if (standardCode) {
      this.setApplicantType(forms, 'standard', { emitEvent });
      this.setStandardApplicantCode(forms, standardCode, { emitEvent });

      // reset subforms
      forms.personForm.reset();
      forms.organisationForm.reset();

      markFormGroupClean(forms.personForm);
      markFormGroupClean(forms.organisationForm);

      return {
        applicantType: 'standard',
        selectedStandardApplicantCode: standardCode,
      };
    }

    const applicant: Applicant | undefined = dto.applicant;

    if (applicant?.person) {
      this.setApplicantType(forms, 'person', { emitEvent });
      this.setStandardApplicantCode(forms, null, { emitEvent });

      forms.organisationForm.reset(this.emptyOrganisation, { emitEvent });
      forms.personForm.patchValue(personToFormPatch(applicant.person), {
        emitEvent,
      });

      markFormGroupClean(forms.personForm);
      markFormGroupClean(forms.organisationForm);

      return { applicantType: 'person', selectedStandardApplicantCode: null };
    }

    if (applicant?.organisation) {
      this.setApplicantType(forms, 'org', { emitEvent });
      this.setStandardApplicantCode(forms, null, { emitEvent });

      forms.personForm.reset();
      forms.organisationForm.patchValue(
        organisationToFormPatch(applicant.organisation),
        { emitEvent },
      );

      markFormGroupClean(forms.personForm);
      markFormGroupClean(forms.organisationForm);

      return { applicantType: 'org', selectedStandardApplicantCode: null };
    }

    // Default to org, empty
    this.setApplicantType(forms, 'org', { emitEvent });
    this.setStandardApplicantCode(forms, null, { emitEvent });

    forms.personForm.reset();
    forms.organisationForm.reset();

    markFormGroupClean(forms.personForm);
    markFormGroupClean(forms.organisationForm);

    return { applicantType: 'org', selectedStandardApplicantCode: null };
  }

  /**
   * Called from the applicantType valueChanges subscription (UI-driven switch).
   * Keeps component tiny and behaviour consistent.
   */
  onApplicantTypeChanged(
    forms: ApplicationListEntryForms,
    type: ApplicantType,
  ): void {
    // Clear standard applicant code unless "standard"
    if (type !== 'standard') {
      this.setStandardApplicantCode(forms, null, { emitEvent: false });
    }

    forms.personForm.reset();
    forms.organisationForm.reset();

    markFormGroupClean(forms.personForm);
    markFormGroupClean(forms.organisationForm);
    forms.form.controls.standardApplicantCode.updateValueAndValidity({
      emitEvent: false,
    });
  }

  resetSectionsOnApplicationCodeChange(forms: ApplicationListEntryForms): void {
    forms.form.patchValue({
      // wording section fields
      wordingFields: null,

      // respondent section fields
      respondentEntryType: null,

      // Civil fee section fields
      feeStatuses: null,
      feeStatus: null,
      feeStatusDate: null,
      paymentRef: null,
    });

    // reset respondent section forms person and organisation
    forms.personForm.reset();
    forms.organisationForm.reset();

    markFormGroupClean(forms.personForm);
    markFormGroupClean(forms.organisationForm);
  }

  setApplicantType(
    forms: ApplicationListEntryForms,
    type: ApplicantType,
    opts?: { emitEvent?: boolean },
  ): void {
    forms.form.controls.applicantType.setValue(type, {
      emitEvent: opts?.emitEvent !== false,
    });
  }

  setStandardApplicantCode(
    forms: ApplicationListEntryForms,
    code: string | null,
    opts?: { emitEvent?: boolean },
  ): void {
    const trimmed = code?.trim() || null;
    forms.form.controls.standardApplicantCode.setValue(trimmed, {
      emitEvent: opts?.emitEvent !== false,
    });
  }

  /**
   * Build update DTO from forms; optionally syncs UI-held selected standard code.
   */
  buildUpdateDto(
    detail: EntryGetDetailDto,
    forms: ApplicationListEntryForms,
    selectedStandardApplicantCode?: string | null,
  ): EntryUpdateDto {
    if (selectedStandardApplicantCode !== undefined) {
      this.setStandardApplicantCode(forms, selectedStandardApplicantCode, {
        emitEvent: false,
      });
    }

    const formValue: ApplicationsListEntryFormValue = forms.form.getRawValue();

    const applicantPersonValue = forms.personForm.getRawValue();
    const applicantOrgValue = forms.organisationForm.getRawValue();

    const respondentPersonValue = forms.respondentPersonForm.getRawValue();
    const respondentOrgValue = forms.respondentOrganisationForm.getRawValue();

    return buildEntryUpdateDtoFromForm(
      detail,
      formValue,
      applicantPersonValue,
      applicantOrgValue,
      respondentPersonValue,
      respondentOrgValue,
    );
  }

  buildCreateDto(
    forms: ApplicationListEntryForms,
    selectedStandardApplicantCode?: string | null,
  ): EntryCreateDto {
    if (selectedStandardApplicantCode !== undefined) {
      this.setStandardApplicantCode(forms, selectedStandardApplicantCode, {
        emitEvent: false,
      });
    }

    return buildEntryCreateDto(
      forms.form.getRawValue(),
      forms.personForm.getRawValue(),
      forms.organisationForm.getRawValue(),
      forms.respondentPersonForm.getRawValue(),
      forms.respondentOrganisationForm.getRawValue(),
    );
  }

  syncApplicantTypeState(
    forms: ApplicationListEntryForms,
    type: ApplicantType,
  ): void {
    const codeCtrl = forms.form.controls.standardApplicantCode;

    if (type === 'standard') {
      codeCtrl.enable({ emitEvent: false });
    } else {
      codeCtrl.disable({ emitEvent: false });
    }

    codeCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private hydrateRespondentFromDto(
    dto: EntryGetDetailDto,
    forms: ApplicationListEntryForms,
    emitEvent: boolean,
  ): void {
    const r = dto.respondent;

    forms.form.controls.respondent.setValue(r ?? null, { emitEvent });
    forms.form.controls.respondentEntryType.setValue(
      getRespondentEntryType(r),
      { emitEvent },
    );

    if (r?.person) {
      forms.respondentPersonForm.reset(undefined, { emitEvent });
      forms.respondentPersonForm.patchValue(personToFormPatch(r.person), {
        emitEvent,
      });
    } else if (r?.organisation) {
      forms.respondentOrganisationForm.reset(undefined, { emitEvent });
      forms.respondentOrganisationForm.patchValue(
        organisationToFormPatch(r.organisation),
        { emitEvent },
      );
    }

    markFormGroupClean(forms.respondentPersonForm);
    markFormGroupClean(forms.respondentOrganisationForm);
  }
}
