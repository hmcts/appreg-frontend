export interface Fee {
  fee_id: number;
  fee_reference: string;
  fee_description: string;
  fee_value: number;
  fee_start_date: string;
  fee_end_date: string | null;
  fee_version: number;
  fee_changed_by: number;
  fee_changed_date: string;
  fee_user_name: string;
}

// Optional params
export type FeeSearchParams = {
  reference?: string;
  startDate?: string; // 'DD/MM/YYYY'
  endDate?: string;
  value?: number;
  page?: number;
  size?: number;
};
