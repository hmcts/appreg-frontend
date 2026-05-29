import { FormGroup } from '@angular/forms';

import { toOptionalTrimmed } from '@components/applications-list-entry-create/util';
import {
  ActivityAuditFilterDto,
  ActivityType,
  CreateActivityAuditReportRequestParams,
  CreateDurationReportRequestParams,
  CreateListMaintenanceReportRequestParams,
  CreateSearchWarrantsReportRequestParams,
  CreateWorkloadReportRequestParams,
  DurationFilterDto,
  FeesReportFilterDto,
  LegacyReportLocation,
  ListMaintenanceFilterDto,
  SearchWarrantsReportFilterDto,
  WorkloadFilterDto,
} from '@openapi';

interface FeesReportFormValue {
  dateFrom: string;
  dateTo: string;
  standardApplicantCode: string | null;
  surnameOrOrg: string | null;
  court: string | null;
  otherLocation: string | null;
  cja: string | null;
}

interface ReportLocationFormValue {
  court: string | null;
  otherLocation: string | null;
  cja: string | null;
}

interface DurationReportFormValue {
  dateFrom: string;
  dateTo: string;
  court: string | null;
  otherLocation: string | null;
  cja: string | null;
}

interface ListMaintenanceReportFormValue {
  dateFrom: string;
  dateTo: string;
  description: string | null;
  court: string | null;
  otherLocation: string | null;
  cja: string | null;
}

interface SearchWarrantsReportFormValue {
  dateFrom: string;
  dateTo: string;
  court: string | null;
  otherLocation: string | null;
  cja: string | null;
}

interface WorkloadReportFormValue {
  dateFrom: string;
  dateTo: string;
  court: string | null;
  otherLocation: string | null;
  cja: string | null;
}

interface ActivityAuditReportFormValue {
  dateFrom: string;
  dateTo: string;
  username: string | null;
  activity: string[];
}

export function mapFeeGroupToFeesReportFilterDto(
  feeGroup: FormGroup,
): FeesReportFilterDto {
  const value = feeGroup.getRawValue() as FeesReportFormValue;
  const location = buildLocation(value);

  return {
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
    standardApplicantCode: toOptionalTrimmed(value.standardApplicantCode),
    applicantName: toOptionalTrimmed(value.surnameOrOrg),
    ...(location ? { location } : {}),
  };
}

export function mapDurationGroupToDurationReportRequestParams(
  durationGroup: FormGroup,
): CreateDurationReportRequestParams {
  return {
    durationFilterDto: mapDurationGroupToDurationFilterDto(durationGroup),
  };
}

export function mapListMaintenanceGroupToListMaintenanceReportRequestParams(
  listMaintenanceGroup: FormGroup,
): CreateListMaintenanceReportRequestParams {
  return {
    listMaintenanceFilterDto:
      mapListMaintenanceGroupToListMaintenanceFilterDto(listMaintenanceGroup),
  };
}

export function mapSearchWarrantsGroupToSearchWarrantsReportRequestParams(
  searchWarrantsGroup: FormGroup,
): CreateSearchWarrantsReportRequestParams {
  return {
    searchWarrantsReportFilterDto:
      mapSearchWarrantsGroupToSearchWarrantsReportFilterDto(
        searchWarrantsGroup,
      ),
  };
}

export function mapWorkloadGroupToWorkloadReportRequestParams(
  workloadGroup: FormGroup,
): CreateWorkloadReportRequestParams {
  return {
    workloadFilterDto: mapWorkloadGroupToWorkloadFilterDto(workloadGroup),
  };
}

export function mapActivityAuditGroupToActivityAuditRequestParams(
  activityAudit: FormGroup,
): CreateActivityAuditReportRequestParams {
  return {
    activityAuditFilterDto: mapActivityAuditFormToParams(activityAudit),
  };
}

function mapDurationGroupToDurationFilterDto(
  durationGroup: FormGroup,
): DurationFilterDto {
  const value = durationGroup.getRawValue() as DurationReportFormValue;
  const location = buildLocation(value);

  return {
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
    ...(location ? { location } : {}),
  };
}

function mapListMaintenanceGroupToListMaintenanceFilterDto(
  listMaintenanceGroup: FormGroup,
): ListMaintenanceFilterDto {
  const value =
    listMaintenanceGroup.getRawValue() as ListMaintenanceReportFormValue;
  const listDescription = toOptionalTrimmed(value.description);
  const location = buildLocation(value);

  return {
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
    ...(listDescription ? { listDescription } : {}),
    ...(location ? { location } : {}),
  };
}

function mapSearchWarrantsGroupToSearchWarrantsReportFilterDto(
  searchWarrantsGroup: FormGroup,
): SearchWarrantsReportFilterDto {
  const value =
    searchWarrantsGroup.getRawValue() as SearchWarrantsReportFormValue;
  const location = buildLocation(value);

  return {
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
    ...(location ? { location } : {}),
  };
}

function mapWorkloadGroupToWorkloadFilterDto(
  workloadGroup: FormGroup,
): WorkloadFilterDto {
  const value = workloadGroup.getRawValue() as WorkloadReportFormValue;
  const location = buildLocation(value);

  return {
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
    ...(location ? { location } : {}),
  };
}

function mapActivityAuditFormToParams(
  activityAuditGroup: FormGroup,
): ActivityAuditFilterDto {
  const value =
    activityAuditGroup.getRawValue() as ActivityAuditReportFormValue;
  const username = toOptionalTrimmed(value.username);
  const formActivities = mapActivitiesToType(value.activity);

  return {
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
    activityTypes: formActivities,
    ...(username ? { username } : {}),
  };
}

function mapActivitiesToType(activities: string[]): ActivityType[] {
  return activities.filter(isActivityType);
}

export function isActivityType(value: unknown): value is ActivityType {
  return Object.values(ActivityType).includes(value as ActivityType);
}

function buildLocation(
  value: ReportLocationFormValue,
): LegacyReportLocation | undefined {
  const courtLocationCode = toOptionalTrimmed(value.court);

  if (courtLocationCode) {
    return { courtLocationCode };
  }

  const otherLocationDescription = toOptionalTrimmed(value.otherLocation);
  const cjaCode = toOptionalTrimmed(value.cja);
  const location: LegacyReportLocation = {};

  if (otherLocationDescription) {
    location.otherLocationDescription = otherLocationDescription;
  }

  if (cjaCode) {
    location.cjaCode = cjaCode;
  }

  return Object.keys(location).length > 0 ? location : undefined;
}
