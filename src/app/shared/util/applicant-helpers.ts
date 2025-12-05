import { ContactDetails, FullName, Organisation, Person } from '../../../generated/openapi';

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

const EMPTY_FULL_NAME: FullName = {
  title: '',
  firstForename: '',
  secondForename: '',
  thirdForename: '',
  surname: '',
};

export function createEmptyPerson(): Person {
  return {
    name: { ...EMPTY_FULL_NAME },
    contactDetails: { ...EMPTY_CONTACT_DETAILS },
  };
}

export function createEmptyOrganisation(): Organisation {
  return {
    name: '',
    contactDetails: { ...EMPTY_CONTACT_DETAILS },
  };
}
