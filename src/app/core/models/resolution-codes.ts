export interface ResolutionCodes {
  rc_id: number; // NUMERIC NOT NULL
  resolution_code: string; // varchar(10) NOT NULL
  resolution_code_title: string; // varchar(500) NOT NULL
  resolution_code_wording: string; // text NOT NULL
  resolution_legislation: string | null; // text
  rc_destination_email_address_1: string | null; // varchar(253)
  rc_destination_email_address_2: string | null; // varchar(253)
  resolution_code_start_date: string; // timestamp NOT NULL (ISO string)
  resolution_code_end_date: string | null; // timestamp
  version: number; // NUMERIC NOT NULL
  changed_by: number; // NUMERIC NOT NULL
  changed_date: string; // timestamp NOT NULL (ISO string)
  user_name: string | null; // varchar(250)
}
