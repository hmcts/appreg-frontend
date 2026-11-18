import { Injectable, computed, signal } from '@angular/core';

import { CsvEdits, UploadCsv, writeUploadCsv } from './bulk-upload-csv';

export interface UploadRowError {
  rowNumber: number | null;
  location: string | null;
  message: string | null;
  errorType: 'HEADER_ERROR' | 'DATA_ERROR';
}

export interface CorrectionField {
  column: number;
  header: string;
  label: string;
  value: string;
  messages: string[];
}

const FIELD_HEADERS: Record<string, string[]> = {
  standardApplicantCode: ['APPLICANT_CODE'],
  applicationCode: ['APPLICATION_CODE'],
  name: ['RESP_NAME_ORG'],
  title: ['RESP_TITLE'],
  firstName: ['RESP_FIRST_NAME', 'RESP_FORENAME1'],
  middleNames: ['RESP_MIDDLE_NAME', 'RESP_FORENAME2', 'RESP_FORENAME3'],
  middleName: ['RESP_MIDDLE_NAME', 'RESP_FORENAME2', 'RESP_FORENAME3'],
  lastName: ['RESP_LAST_NAME', 'RESP_SURNAME'],
  addressLine1: ['RESP_ADDLINE1'],
  addressLine2: ['RESP_ADDLINE2'],
  addressLine3: ['RESP_ADDLINE3'],
  addressLine4: ['RESP_ADDLINE4'],
  addressLine5: ['RESP_ADDLINE5'],
  postcode: ['RESP_POSTCODE'],
  email: ['RESP_EMAIL'],
  phone: ['RESP_TEL'],
  mobile: ['RESP_MOBILE'],
  accountNumber: ['ACCOUNT_NUMBER'],
  ACCOUNT_NUMBER: ['ACCOUNT_NUMBER'],
};

const FIELD_LABELS: Record<string, string> = {
  APPLICANT_CODE: 'Applicant code',
  APPLICATION_CODE: 'Application code',
  RESP_NAME_ORG: 'Respondent organisation name',
  RESP_TITLE: 'Respondent title',
  RESP_FIRST_NAME: 'Respondent first name',
  RESP_FORENAME1: 'Respondent first name',
  RESP_MIDDLE_NAME: 'Respondent middle name',
  RESP_FORENAME2: 'Respondent second forename',
  RESP_FORENAME3: 'Respondent third forename',
  RESP_LAST_NAME: 'Respondent last name',
  RESP_SURNAME: 'Respondent surname',
  RESP_POSTCODE: 'Respondent postcode',
  RESP_EMAIL: 'Respondent email',
  RESP_TEL: 'Respondent telephone',
  RESP_MOBILE: 'Respondent mobile',
  ACCOUNT_NUMBER: 'Account number',
};

export function csvFieldLabel(header: string): string {
  const address = /^RESP_ADDLINE([1-5])$/.exec(header);
  const wording = /^APPLICATION_TEXT(\d+)$/.exec(header);
  return (
    FIELD_LABELS[header] ??
    (address
      ? `Respondent address line ${address[1]}`
      : wording
        ? `Application text ${wording[1]}`
        : header)
  );
}

export function columnsForError(
  location: string | null,
  headers: string[],
): number[] {
  const field = location?.split('.').pop() ?? '';
  const respondentGroup =
    field === 'RESPONDENT' || field.startsWith('RESP_NAME_ORG/');
  const names = FIELD_HEADERS[field];
  return headers.flatMap((header, column) => {
    const matches = respondentGroup
      ? header.startsWith('RESP_')
      : field === 'APPLICATION_TEXT'
        ? /^APPLICATION_TEXT\d+$/.test(header)
        : names
          ? names.includes(header)
          : false;
    return matches ? [column] : [];
  });
}

/** Component-scoped: upload contents never enter browser storage or router state. */
@Injectable()
export class BulkUploadCorrections {
  readonly csv = signal<UploadCsv | null>(null);
  readonly errors = signal<UploadRowError[]>([]);
  readonly edits = signal<CsvEdits>(new Map());
  readonly changedRows = signal<ReadonlySet<number>>(new Set());
  readonly hasChanges = computed(() => this.edits().size > 0);
  readonly hasChangesSinceValidation = computed(
    () => this.changedRows().size > 0,
  );
  readonly canMapRows = computed(() => {
    const csv = this.csv();
    const errors = this.errors();
    return (
      !!csv &&
      errors.length > 0 &&
      errors.every(
        (error) =>
          error.errorType === 'DATA_ERROR' &&
          Number.isInteger(error.rowNumber) &&
          error.rowNumber !== null &&
          error.rowNumber >= 2 &&
          error.rowNumber <= csv.records.length + 1,
      )
    );
  });
  readonly records = computed(() => {
    if (!this.canMapRows()) {
      return [];
    }
    return [
      ...new Set(this.errors().map((error) => error.rowNumber as number)),
    ].map((rowNumber) => ({
      rowNumber,
      applicantCode:
        this.fields(rowNumber).find(
          (field) => field.header === 'APPLICANT_CODE',
        )?.value ?? 'Not provided',
      messages: [
        ...new Set(
          this.errors()
            .filter((error) => error.rowNumber === rowNumber)
            .map((error) => error.message ?? 'Check this record.'),
        ),
      ],
      editable: this.fields(rowNumber).some(
        (field) => field.messages.length > 0,
      ),
      changed: this.changedRows().has(rowNumber),
      hasUnmappedErrors: this.errors().some(
        (error) =>
          error.rowNumber === rowNumber &&
          !columnsForError(error.location, this.csv()?.headers ?? []).length,
      ),
    }));
  });

  reset(csv: UploadCsv | null = null): void {
    this.csv.set(csv);
    this.errors.set([]);
    this.edits.set(new Map());
    this.changedRows.set(new Set());
  }

  setErrors(errors: UploadRowError[]): void {
    this.errors.set(errors);
    this.changedRows.set(new Set());
  }

  fields(rowNumber: number): CorrectionField[] {
    const csv = this.csv();
    const row = csv?.records[rowNumber - 2];
    if (!csv || !row) {
      return [];
    }
    return csv.headers.map((header, column) => ({
      header,
      column,
      label: csvFieldLabel(header),
      value:
        this.edits()
          .get(rowNumber - 2)
          ?.get(column) ?? row[column].value,
      messages: [
        ...new Set(
          this.errors()
            .filter(
              (error) =>
                error.rowNumber === rowNumber &&
                columnsForError(error.location, csv.headers).includes(column),
            )
            .map((error) => error.message ?? 'Check this field.'),
        ),
      ],
    }));
  }

  save(rowNumber: number, values: ReadonlyMap<number, string>): void {
    if (!this.canMapRows()) {
      return;
    }
    const fields = this.fields(rowNumber);
    const edits = new Map(this.edits());
    const rowEdits = new Map(edits.get(rowNumber - 2));
    let changed = false;
    for (const field of fields.filter((item) => item.messages.length)) {
      const value = values.get(field.column);
      if (value === undefined || value === field.value) {
        continue;
      }
      changed = true;
      if (value === this.csv()?.records[rowNumber - 2][field.column].value) {
        rowEdits.delete(field.column);
      } else {
        rowEdits.set(field.column, value);
      }
    }
    if (!changed) {
      return;
    }
    if (rowEdits.size) {
      edits.set(rowNumber - 2, rowEdits);
    } else {
      edits.delete(rowNumber - 2);
    }
    this.edits.set(edits);
    this.changedRows.update((rows) => new Set([...rows, rowNumber]));
  }

  file(): File | null {
    const csv = this.csv();
    return csv
      ? new File(
          [writeUploadCsv(csv, this.edits())],
          'corrected-bulk-upload.csv',
          { type: 'text/csv;charset=utf-8' },
        )
      : null;
  }
}
