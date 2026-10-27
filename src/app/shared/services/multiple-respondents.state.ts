import { Injectable, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';

import { buildOrganisationForm } from '@components/applications-list-entry-detail/util/entry-detail.form';
import { TemplateSubstitution } from '@openapi';
import {
  ApplicationsListEntryForm,
  OrganisationForm,
  OrganisationFormValue,
} from '@shared-types/applications-list-entry-create/application-list-entry-form';

export function isAccountCountKey(key: string): boolean {
  return ['noofaccounts', 'numberofaccounts'].includes(
    key.toLowerCase().replace(/[^a-z]/g, ''),
  );
}

export type RespondentRow = {
  id: number;
  form: OrganisationForm;
  editing: boolean;
  savedValue?: OrganisationFormValue;
};

/** Per-entry, local prototype state. The API still accepts only one respondent. */
@Injectable()
export class MultipleRespondentsState {
  private readonly fb = inject(NonNullableFormBuilder);
  private nextId = 1;
  readonly active = signal(false);
  readonly count = signal<string | null>(null);
  readonly rows = signal<RespondentRow[]>([]);
  readonly pending = signal<number[]>([]);
  readonly announcement = signal('');
  readonly countError = signal<string | null>(null);
  readonly saveBlocked = computed(
    () =>
      this.rows().length > 1 ||
      !!this.countError() ||
      this.pending().length > 0,
  );
  readonly saveMessage =
    'This local prototype cannot save multiple respondents. Additional respondent details remain on this page only.';

  sync(
    field: TemplateSubstitution | null,
    first: OrganisationForm,
    form: ApplicationsListEntryForm,
  ): void {
    if (!field) {
      if (this.rows().length > 1) {
        this.countError.set(
          'The selected wording has no account count. Remove the additional respondents before saving.',
        );
      } else {
        this.active.set(false);
        this.count.set(null);
        this.countError.set(null);
      }
      return;
    }
    if (!this.rows().length) {
      this.rows.set([
        {
          id: 0,
          form: first,
          editing: !first.valid,
          savedValue: first.valid ? first.getRawValue() : undefined,
        },
      ]);
    }
    this.active.set(true);
    this.count.set(field.value);
    form.controls.respondentEntryType.setValue('organisation', {
      emitEvent: false,
    });
    this.validateCount(field.value);
  }

  private validateCount(value: string): void {
    const count = Number(value);
    if (
      !/^\d+$/.test(value.trim()) ||
      !Number.isInteger(count) ||
      count < 1 ||
      count > 20
    ) {
      this.countError.set(
        'Enter a whole number of accounts between 1 and 20 in Wording',
      );
      return;
    }
    this.countError.set(null);
  }

  add(): void {
    if (this.rows().length >= 20) {
      return;
    }
    this.rows.update((rows) => [
      ...rows,
      {
        id: this.nextId++,
        form: buildOrganisationForm(this.fb),
        editing: true,
      },
    ]);
    this.count.set(String(this.rows().length));
    this.countError.set(null);
    this.announcement.set(
      `${this.rows().length} respondent sections. Existing details have been kept.`,
    );
  }

  edit(id: number): void {
    this.rows.update((rows) =>
      rows.map((row) => (row.id === id ? { ...row, editing: true } : row)),
    );
  }

  complete(id: number): boolean {
    const row = this.rows().find((item) => item.id === id);
    if (!row) {
      return false;
    }
    row.form.markAllAsTouched();
    row.form.updateValueAndValidity();
    if (row.form.invalid) {
      return false;
    }
    this.rows.update((rows) =>
      rows.map((item) =>
        item.id === id
          ? { ...item, editing: false, savedValue: item.form.getRawValue() }
          : item,
      ),
    );
    this.announcement.set('Respondent details updated on this page.');
    return true;
  }

  cancelEdit(id: number): void {
    const row = this.rows().find((item) => item.id === id);
    if (!row?.savedValue) {
      return;
    }
    row.form.patchValue(row.savedValue);
    this.rows.update((rows) =>
      rows.map((item) => (item.id === id ? { ...item, editing: false } : item)),
    );
  }

  cancelAdding(id: number): boolean {
    const row = this.rows().find((item) => item.id === id);
    if (!row || row.savedValue || this.rows().length <= 1) {
      return false;
    }
    this.remove(id);
    this.confirmRemoval();
    this.announcement.set(
      `Respondent addition cancelled. ${this.rows().length} respondent sections remaining.`,
    );
    return true;
  }

  remove(id: number): void {
    if (this.rows().length > 1) {
      this.pending.set([id]);
    }
  }

  confirmRemoval(): void {
    const rows = this.rows();
    const retained = rows.filter((row) => !this.pending().includes(row.id));
    if (!retained.length) {
      return;
    }
    // Keep the real form's first organisation group attached to existing save/validation paths.
    if (retained[0] !== rows[0]) {
      rows[0].form.patchValue(retained[0].form.getRawValue());
      retained[0] = { ...retained[0], form: rows[0].form };
    }
    this.rows.set(retained);
    this.count.set(String(retained.length));
    this.pending.set([]);
    this.countError.set(null);
    this.announcement.set(`${retained.length} respondent sections remaining.`);
  }

  cancelRemoval(): void {
    this.pending.set([]);
    this.count.set(String(this.rows().length));
    this.countError.set(null);
  }
}
