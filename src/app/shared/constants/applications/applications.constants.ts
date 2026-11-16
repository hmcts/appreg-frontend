export const ApplicationsColumns = [
  { header: 'Date', field: 'date', wrap: false },
  { header: 'Applicant', field: 'applicant' },
  { header: 'Respondent', field: 'respondent' },
  { header: 'Application title', field: 'title' },
  { header: 'Fee', field: 'fee' },
  { header: 'Resulted', field: 'resulted' },
  { header: 'Status', field: 'status', wrap: false },
  { header: 'Actions', field: 'actions', sortable: false },
];

// Most court codes the API accepts in one search (EntryGetFilterDto.courtCodes)
export const COURT_CODES_MAX_ITEMS = 20;

// Court takes one of the codes the API accepts
export const OTHER_COURTS_MAX_ITEMS = COURT_CODES_MAX_ITEMS - 1;
