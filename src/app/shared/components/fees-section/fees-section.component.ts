import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { toOptionalTrimmed } from '@components/applications-list-entry-create/util';
import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { ReportsSharedFormComponent } from '@components/reports-shared-form/reports-shared-form.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import {
  CreateFeesReportRequestParams,
  FeesReportFilterDto,
  LegacyReportLocation,
  ReportsApi,
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

@Component({
  selector: 'app-fees-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TextInputComponent,
    ReportsSharedFormComponent,
  ],
  templateUrl: './fees-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeesSectionComponent {
  private readonly reportApi = inject(ReportsApi);
  /** Parent passes the nested form group for the Fees section */
  readonly group = input.required<FormGroup>();

  suggestions = input.required<SuggestionsFacade>();
  submitted = input(false);
  getError = input<((id: string) => ErrorItem | undefined) | null>(null);

  feeJobId = output<string>();
  errors = output<HttpErrorResponse>();

  onSubmit(): void {
    const reqParam: CreateFeesReportRequestParams = {
      feesReportFilterDto: this.mapFeeGroupToFeesReportFilterDto(this.group()),
    };

    this.reportApi.createFeesReport(reqParam).subscribe({
      next: (response) => this.feeJobId.emit(response.id),
      error: (err) => this.errors.emit(err as HttpErrorResponse),
    });
  }

  private mapFeeGroupToFeesReportFilterDto(
    feeGroup: FormGroup,
  ): FeesReportFilterDto {
    const value = feeGroup.getRawValue() as FeesReportFormValue;
    const location = this.buildLocation(value);

    return {
      dateFrom: value.dateFrom,
      dateTo: value.dateTo,
      standardApplicantCode: toOptionalTrimmed(value.standardApplicantCode),
      applicantName: toOptionalTrimmed(value.surnameOrOrg),
      ...(location ? { location } : {}),
    };
  }

  private buildLocation(
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
}
