export type SummaryListCardActionContent = {
  key: string;
  value: string;
};

export type SummaryListCardAction = {
  id?: string;
  title: string;
  status?: 'pending' | 'existing';
  showValue?: boolean;
  content: SummaryListCardActionContent[];
};
