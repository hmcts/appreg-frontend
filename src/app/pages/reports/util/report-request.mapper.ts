import { FormGroup } from '@angular/forms';

import { toOptionalTrimmed } from '@components/applications-list-entry-create/util';
import { FeesReportFilterDto, LegacyReportLocation } from '@openapi';

interface FeesReportFormValue {
  dateFrom: string;
  dateTo: string;
  standardApplicantCode: string | null;
  surnameOrOrg: string | null;
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

export function buildLocation(
  value: FeesReportFormValue,
): LegacyReportLocation | undefined {
  const courtLocationCode = toOptionalTrimmed(value.court);

  if (courtLocationCode) {
    return { courtLocationCode };
  }

  const otherLocationDescription = toOptionalTrimmed(value.otherLocation);
  const cjaCode = toOptionalTrimmed(value.cja);

  if (cjaCode) {
    return {
      ...(otherLocationDescription ? { otherLocationDescription } : {}),
      cjaCode,
    };
  }

  return undefined;
}
