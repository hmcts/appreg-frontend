import { ReportOption } from '@components/report-option/report-selector.component';

export const reportOptions: ReportOption[] = [
  {
    id: 'activity-audit',
    label: 'Activity audit',
    hint: 'Provides a report of all user activity for a given period and optionally filtered by username and court',
  },
  {
    id: 'fees',
    label: 'Fees',
    hint: 'Report of dealt-with applications with fee details for a date range and optional filters',
  },
  {
    id: 'list-maintenance',
    label: 'List maintenance',
    hint: "Provides a report of all 'open' lists that are older than a specified date",
  },
  {
    id: 'search-warrants',
    label: 'Search warrants',
    hint: 'Provides an index of all search warrants by date and location filters',
  },
  {
    id: 'workload',
    label: 'Workload',
    hint: 'Closed lists by date and location within a specified period',
  },
  {
    id: 'duration',
    label: 'Duration',
    hint: 'Closed lists with recorded duration for a date range and location filters',
  },
  {
    id: 'private-prosecutors-index',
    label: 'Private prosecutors index',
    hint: 'Index of applications for MX99010 (private prosecutors)',
  },
] as const;
