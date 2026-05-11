import {
  InitialBulkUploadState,
  clearFlags,
} from '@components/applications-list-bulk-upload/util/applications-list-bulk-upload.state';

describe('applications-list-bulk-upload state', () => {
  it('defines the initial bulk upload state', () => {
    expect(InitialBulkUploadState).toEqual({
      isValidCSV: null,
      errorSummary: [],
      isUploadInProgress: false,
      fileUploadStatus: null,
      listId: '',
      file: null,
      jobAcknowledgement: null,
    });
  });

  it('clears validation and upload flags while leaving file and list state to the caller', () => {
    expect(clearFlags()).toEqual({
      isValidCSV: null,
      errorSummary: [],
      isUploadInProgress: false,
      fileUploadStatus: null,
    });
  });

  it('returns a fresh error summary array each time flags are cleared', () => {
    const first = clearFlags();
    first.errorSummary.push({ id: 'file', text: 'Select a CSV file' });

    expect(clearFlags().errorSummary).toEqual([]);
  });
});
