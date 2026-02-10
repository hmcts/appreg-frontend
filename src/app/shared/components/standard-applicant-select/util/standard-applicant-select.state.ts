export interface StandardApplicantSelectPagingState {
  pageIndex: number;
  totalPages: number;
  pageSize: number;
  loading: boolean;
}

export const initialStandardApplicantSelectPagingState: StandardApplicantSelectPagingState =
  {
    pageIndex: 0,
    totalPages: 0,
    pageSize: 10,
    loading: false,
  };
