export interface StandardApplicant {
  id: number;
  applicantCode: string;
  applicantTitle: string | null;
  applicantForename1: string;
  applicantForename2: string | null;
  applicantForename3: string | null;
  applicantSurname: string;
  applicantName: string;
  emailAddress: string | null;
  addressLine1: string;
  addressLine2: string | null;
  addressLine3: string | null;
  addressLine4: string | null;
  addressLine5: string | null;
  postcode: string;
  telephoneNumber: string | null;
  mobileNumber: string | null;
  applicantStartDate: string; // ISO date
  applicantEndDate: string | null; // ISO date
}
