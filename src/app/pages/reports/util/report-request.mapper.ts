import { FormGroup } from '@angular/forms';

import { toOptionalTrimmed } from '@components/applications-list-entry-create/util';
import {
  CreateListMaintenanceReportRequestParams,
  CreateWorkloadReportRequestParams,
  FeesReportFilterDto,
  LegacyReportLocation,
  ListMaintenanceFilterDto,
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

interface ListMaintenanceReportFormValue {
  dateFrom: string;
  dateTo: string;
  description: string | null;
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

export function mapListMaintenanceGroupToListMaintenanceReportRequestParams(
  listMaintenanceGroup: FormGroup,
): CreateListMaintenanceReportRequestParams {
  return {
    listMaintenanceFilterDto:
      mapListMaintenanceGroupToListMaintenanceFilterDto(listMaintenanceGroup),
  };
}

export function mapWorkloadGroupToWorkloadReportRequestParams(
  workloadGroup: FormGroup,
): CreateWorkloadReportRequestParams {
  return {
    workloadFilterDto: mapWorkloadGroupToWorkloadFilterDto(workloadGroup),
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
