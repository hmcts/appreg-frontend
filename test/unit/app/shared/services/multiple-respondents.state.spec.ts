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
    state.add();
    state.rows()[1].form.controls.name.setValue('Example Network');
    sync('3');
    expect(state.rows()).toHaveLength(2);
    expect(state.pending()).toEqual([]);
    state.add();
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
      state.add();
      state.rows()[1].form.controls.name.setValue('Example Network');
      sync(value);
      expect(state.countError()).toBeTruthy();
      expect(state.rows()).toHaveLength(2);
      expect(state.rows()[1].form.controls.name.value).toBe('Example Network');
      expect(state.saveBlocked()).toBe(true);
    },
  );

  it.each(['1', '2', '12', '20'])(
    'preserves all respondents when the wording count changes to %s',
    (value) => {
      const { state, sync } = setup();
      sync('3');
      expect(state.rows()).toHaveLength(1);
      state.add();
      state.add();
      state.rows()[2].form.controls.name.setValue('Example Network');
      const rows = state.rows();
      sync(value);
      expect(state.rows()).toBe(rows);
      expect(state.rows()[2].form.controls.name.value).toBe('Example Network');
      expect(state.pending()).toEqual([]);
      expect(state.count()).toBe(value);
      expect(state.countError()).toBeNull();
    },
  );

  it('only confirms or cancels removals requested explicitly', () => {
    const { state, sync } = setup();
    sync('1');
    state.add();
    state.add();
    state.rows()[2].form.controls.name.setValue('Example Network');
    state.remove(2);
    sync('1');
    expect(state.pending()).toEqual([2]);
    state.cancelRemoval();
    expect(state.rows()).toHaveLength(3);
    expect(state.rows()[2].form.controls.name.value).toBe('Example Network');
    state.remove(2);
    sync('0');
    expect(state.pending()).toEqual([2]);
    state.confirmRemoval();
    expect(state.rows()).toHaveLength(2);
    expect(state.rows().some((row) => row.id === 2)).toBe(false);
  });

  it('discards an invalid unsaved addition without validating it or changing the saved respondent', () => {
    const { state, forms, sync } = setup();
    forms.respondentOrganisationForm.patchValue({
      name: 'Example Bank',
      addressLine1: 'Example address',
    });
    sync('1');
    state.add();
    const saved = state.rows()[0];
    const added = state.rows()[1];
    expect(state.complete(added.id)).toBe(false);
    expect(state.cancelAdding(added.id)).toBe(true);
    expect(state.rows()).toEqual([saved]);
    expect(state.rows()[0].form.getRawValue()).toEqual(saved.savedValue);
    expect(state.pending()).toEqual([]);
    expect(state.count()).toBe('1');
    expect(state.saveBlocked()).toBe(false);
    expect(state.announcement()).toContain('Respondent addition cancelled');
  });

  it('does not discard saved respondents, unknown IDs or the only respondent through cancel adding', () => {
    const { state, sync } = setup();
    sync('1');
    expect(state.cancelAdding(0)).toBe(false);
    state.rows()[0].form.patchValue({
      name: 'Example Bank',
      addressLine1: 'Example address',
    });
    state.complete(0);
    state.add();
    state.edit(0);
    const rows = state.rows();
    expect(state.cancelAdding(0)).toBe(false);
    expect(state.cancelAdding(999)).toBe(false);
    expect(state.rows()).toBe(rows);
    expect(state.pending()).toEqual([]);
  });

  it('limits explicit additions to 20 respondents', () => {
    const { state, sync } = setup();
    sync('1');
    for (let i = 0; i < 25; i++) {
      state.add();
    }
    expect(state.rows()).toHaveLength(20);
  });

  it('removes the chosen first respondent while keeping the real form group connected', () => {
    const { state, forms, sync } = setup();
    sync('2');
    state.add();
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
    state.add();
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
