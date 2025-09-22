export * from './application-codes.service';
import { ApplicationCodesApi } from './application-codes.service';
export * from './application-codes.serviceInterface';
export * from './court-location.service';
import { CourtLocationApi } from './court-location.service';
export * from './court-location.serviceInterface';
export * from './court-locations.service';
import { CourtLocationsApi } from './court-locations.service';
export * from './court-locations.serviceInterface';
export * from './criminal-justice-areas.service';
import { CriminalJusticeAreasApi } from './criminal-justice-areas.service';
export * from './criminal-justice-areas.serviceInterface';
export * from './result-codes.service';
import { ResultCodesApi } from './result-codes.service';
export * from './result-codes.serviceInterface';
export * from './standard-applicants.service';
import { StandardApplicantsApi } from './standard-applicants.service';
export * from './standard-applicants.serviceInterface';
export const APIS = [
  ApplicationCodesApi,
  CourtLocationApi,
  CourtLocationsApi,
  CriminalJusticeAreasApi,
  ResultCodesApi,
  StandardApplicantsApi,
];
