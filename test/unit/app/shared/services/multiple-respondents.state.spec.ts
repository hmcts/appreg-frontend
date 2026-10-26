import { TestBed } from '@angular/core/testing';

import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import {
  MultipleRespondentsState,
  isAccountCountKey,
} from '@services/multiple-respondents.state';

describe('MultipleRespondentsState', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [MultipleRespondentsState] });
    const state = TestBed.inject(MultipleRespondentsState);
    const forms = TestBed.inject(ApplicationListEntryFormService).createForms();
    const sync = (value: string) =>
      state.sync(
        { key: 'No. of accounts', value },
        forms.respondentOrganisationForm,
        forms.form,
      );
    return { state, forms, sync };
  }

  it.each(['No. of accounts', 'Number of accounts', 'NO. OF ACCOUNTS'])(
    'recognises the account count token %s without using other numeric wording fields',
    (key) => {
      expect(isAccountCountKey(key)).toBe(true);
      expect(isAccountCountKey('Number of people')).toBe(false);
    },
  );

  it('uses the real first respondent and preserves full details when growing the list', () => {
    const { state, forms, sync } = setup();
    forms.respondentOrganisationForm.patchValue({
      name: 'Example Bank',
      addressLine1: 'Example address',
    });
    sync('2');
    state.rows()[1].form.controls.name.setValue('Example Network');
    sync('3');
    expect(state.rows()).toHaveLength(3);
    expect(state.rows()[0].form).toBe(forms.respondentOrganisationForm);
    expect(state.rows()[0].form.controls.addressLine1.value).toBe(
      'Example address',
    );
    expect(state.rows()[1].form.controls.name.value).toBe('Example Network');
    expect(forms.form.controls.respondentEntryType.value).toBe('organisation');
    expect(state.saveBlocked()).toBe(true);
    expect(state.rows()[2].form.controls.name.hasError('required')).toBe(true);
  });

  it.each(['', '0', '-1', '1.5', '21', 'two', '1e1'])(
    'retains all entered details and blocks saving when the count is %p',
    (value) => {
      const { state, sync } = setup();
      sync('2');
      state.rows()[1].form.controls.name.setValue('Example Network');
      sync(value);
      expect(state.countError()).toBeTruthy();
      expect(state.rows()).toHaveLength(2);
      expect(state.rows()[1].form.controls.name.value).toBe('Example Network');
      expect(state.saveBlocked()).toBe(true);
    },
  );

  it('confirms or cancels reducing the count without silently discarding details', () => {
    const { state, sync } = setup();
    sync('3');
    state.rows()[2].form.controls.name.setValue('Example Network');
    sync('1');
    expect(state.pending()).toHaveLength(2);
    expect(state.rows()).toHaveLength(3);
    state.cancelRemoval();
    expect(state.count()).toBe('3');
    expect(state.rows()[2].form.controls.name.value).toBe('Example Network');
    sync('1');
    state.confirmRemoval();
    expect(state.rows()).toHaveLength(1);
    expect(state.saveBlocked()).toBe(false);
  });

  it('does not leave a stale removal confirmation after an invalid count is entered', () => {
    const { state, sync } = setup();
    sync('3');
    sync('1');
    expect(state.pending()).toHaveLength(2);
    sync('0');
    expect(state.pending()).toHaveLength(0);
    expect(state.rows()).toHaveLength(3);
    expect(state.countError()).toBeTruthy();
  });

  it('removes the chosen first respondent while keeping the real form group connected', () => {
    const { state, forms, sync } = setup();
    sync('2');
    state.rows()[1].form.patchValue({
      name: 'Example Network',
      addressLine1: 'Example address',
    });
    state.remove(0);
    state.confirmRemoval();
    expect(state.rows()).toHaveLength(1);
    expect(state.rows()[0].id).toBe(1);
    expect(state.rows()[0].form).toBe(forms.respondentOrganisationForm);
    expect(forms.respondentOrganisationForm.controls.name.value).toBe(
      'Example Network',
    );
    expect(forms.respondentOrganisationForm.controls.addressLine1.value).toBe(
      'Example address',
    );
    expect(state.count()).toBe('1');
    state.add();
    state.rows()[1].form.controls.name.setValue('Example third organisation');
    state.remove(1);
    state.confirmRemoval();
    expect(state.rows()[0].id).toBe(2);
    expect(state.rows()[0].form).toBe(forms.respondentOrganisationForm);
    expect(forms.respondentOrganisationForm.controls.name.value).toBe(
      'Example third organisation',
    );
  });

  it('keeps trial respondents and blocks saving if a new code has no matching token', () => {
    const { state, forms, sync } = setup();
    sync('2');
    state.sync(null, forms.respondentOrganisationForm, forms.form);
    expect(state.rows()).toHaveLength(2);
    expect(state.active()).toBe(true);
    expect(state.saveBlocked()).toBe(true);
  });

  it('does not change ordinary application forms with no account-count token', () => {
    const { state, forms } = setup();
    state.sync(null, forms.respondentOrganisationForm, forms.form);
    expect(state.active()).toBe(false);
    expect(state.saveBlocked()).toBe(false);
    expect(forms.form.controls.respondentEntryType.value).toBe('person');
  });
});
