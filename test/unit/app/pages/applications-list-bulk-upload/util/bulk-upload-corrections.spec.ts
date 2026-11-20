import {
  BulkUploadCorrections,
  UploadRowError,
  columnsForError,
} from '@components/applications-list-detail/applications-list-bulk-upload/util/bulk-upload-corrections';
import {
  parseUploadCsv,
  writeUploadCsv,
} from '@components/applications-list-detail/applications-list-bulk-upload/util/bulk-upload-csv';

const error = (rowNumber: number, location: string): UploadRowError => ({
  rowNumber,
  location,
  message: 'Check the value',
  errorType: 'DATA_ERROR',
});

describe('bulk upload corrections', () => {
  let state: BulkUploadCorrections;
  beforeEach(() => {
    state = new BulkUploadCorrections();
    state.reset(
      parseUploadCsv(
        'APPLICANT_CODE|APPLICATION_CODE|EXTRA\n0001|BAD|keep\n0002|GOOD|unchanged',
      ),
    );
  });

  it('groups errors by original record and saves only explicitly editable cells', () => {
    state.setErrors([
      error(2, 'applicationCode'),
      error(2, 'standardApplicantCode'),
    ]);
    expect(state.records()).toHaveLength(1);
    state.save(
      2,
      new Map([
        [1, 'FIXED'],
        [2, 'must not change'],
      ]),
    );
    expect(state.fields(2)[1].value).toBe('FIXED');
    expect(state.fields(2)[2].value).toBe('keep');
    expect(state.fields(3)[1].value).toBe('GOOD');
    expect(state.records()[0].changed).toBe(true);
    expect(state.hasChangesSinceValidation()).toBe(true);
  });

  it('retains edits but replaces errors and validation status after another failed upload', () => {
    state.setErrors([error(2, 'applicationCode')]);
    state.save(2, new Map([[1, 'FIXED']]));
    state.setErrors([error(3, 'applicationCode')]);
    expect(state.fields(2)[1].value).toBe('FIXED');
    expect(state.records().map((record) => record.rowNumber)).toEqual([3]);
    expect(state.hasChangesSinceValidation()).toBe(false);
    expect(state.hasChanges()).toBe(true);
    state.save(3, new Map([[1, 'ALSO_FIXED']]));
    expect(writeUploadCsv(state.csv()!, state.edits())).toBe(
      'APPLICANT_CODE|APPLICATION_CODE|EXTRA\n0001|"FIXED"|keep\n0002|"ALSO_FIXED"|unchanged',
    );
  });

  it('does not claim a record changed when saved without edits', () => {
    state.setErrors([error(2, 'applicationCode')]);
    state.save(2, new Map([[1, 'BAD']]));
    expect(state.hasChanges()).toBe(false);
    expect(state.hasChangesSinceValidation()).toBe(false);
  });

  it.each([
    [error(1, 'applicationCode')],
    [error(8, 'applicationCode')],
    [{ ...error(2, 'applicationCode'), errorType: 'HEADER_ERROR' as const }],
  ])(
    'disables all row editing when row identity cannot be trusted: %p',
    (errors) => {
      state.setErrors(errors);
      expect(state.canMapRows()).toBe(false);
      state.save(2, new Map([[1, 'FIXED']]));
      expect(state.hasChanges()).toBe(false);
    },
  );

  it('keeps unsupported errors visible without guessing a column', () => {
    state.setErrors([error(2, 'APPLICATION_LIST')]);
    expect(state.records()[0]).toMatchObject({
      editable: false,
      hasUnmappedErrors: true,
    });
  });

  it('maps grouped respondent errors to the actual canonical columns', () => {
    expect(
      columnsForError('RESP_NAME_ORG/RESP_FORENAME1/RESP_SURNAME', [
        'APPLICATION_CODE',
        'RESP_NAME_ORG',
        'RESP_FIRST_NAME',
        'RESP_MIDDLE_NAME',
        'RESP_LAST_NAME',
      ]),
    ).toEqual([1, 2, 3, 4]);
  });

  it('maps numbered wording fields and legacy middle-name fields without inventing columns', () => {
    expect(
      columnsForError('APPLICATION_TEXT', [
        'APPLICATION_TEXT2',
        'EXTRA',
        'APPLICATION_TEXT1',
      ]),
    ).toEqual([0, 2]);
    expect(
      columnsForError('middleNames', ['RESP_FORENAME2', 'RESP_FORENAME3']),
    ).toEqual([0, 1]);
  });

  it('clears contents and edits when replacing or completing an upload', () => {
    state.setErrors([error(2, 'applicationCode')]);
    state.save(2, new Map([[1, 'FIXED']]));
    state.reset();
    expect(state.csv()).toBeNull();
    expect(state.errors()).toEqual([]);
    expect(state.hasChanges()).toBe(false);
  });
});
