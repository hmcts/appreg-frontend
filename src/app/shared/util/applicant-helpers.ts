/*
Helper functions for Applicants
*/

import { ContactDetails, Organisation } from '@openapi';

const EMPTY_CONTACT_DETAILS: ContactDetails = {
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  addressLine4: '',
  addressLine5: '',
  postcode: '',
  phone: '',
  mobile: '',
  email: '',
};

export function createEmptyOrganisation(): Organisation {
  return {
    name: '',
    contactDetails: { ...EMPTY_CONTACT_DETAILS },
  };
}
