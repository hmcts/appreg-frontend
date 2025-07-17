export interface IdentityDetails {
  id: number;
  title: string;
  forename1: string;
  forename2: string | null;
  forename3: string | null;
  surname: string;
  name: string | null;
  addressLine1: string;
  addressLine2: string | null;
  addressLine3: string | null;
  addressLine4: string | null;
  addressLine5: string | null;
  postcode: string;
  telephoneNumber: string | null;
  mobileNumber: string | null;
  emailAddress: string | null;
  code: string | null;
  dateOfBirth: string | null; // ISO date string
}
