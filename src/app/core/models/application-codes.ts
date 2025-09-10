export interface ApplicationCodes {
  acId: number;
  applicationCode: string; // varchar(10)
  applicationCodeTitle: string; // varchar(500)
  applicationCodeWording: string; // text
  applicationLegislation?: string | null; // text, nullable
  feeDue: string; // char(1)
  applicationCodeRespondent: string; // char(1)
  acDestinationEmailAddress1?: string | null; // varchar(253), nullable
  acDestinationEmailAddress2?: string | null; // varchar(253), nullable
  applicationCodeStartDate: string; // timestamp 
  applicationCodeEndDate?: string | null; // timestamp
  bulkRespondentAllowed: string; // char(1)
  version: number; // numeric
  changedBy: number; // numeric
  changedDate: string; // timestamp
  userName?: string | null; // varchar(250), nullable
  acFeeReference?: string | null;
}
