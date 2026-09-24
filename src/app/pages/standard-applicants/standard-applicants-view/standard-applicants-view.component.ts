/**
 * View Standard Applicant
 * Main Component for page /standard-applicants/:id
 *
 * Functionality:
 * ngOnInit():
 * - GET request to retrieve the selected Standard Applicant
 * - Maps the response into summary list values for display
 * - Redirects back to the Standard Applicants search page if loading fails
 */

import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  Applicant,
  StandardApplicantGetDetailDto,
  StandardApplicantsApi,
} from '@openapi';
import { getProblemText } from '@util/http-error-to-text';
import { formatDate } from '@util/standard-applicant-helpers';
import { returnOrgName } from '@util/string-helpers';

interface StandardApplicantSummaryListValues {
  standardApplicantName?: string | null;
  useFrom?: string;
  useTo?: string | null;
}

@Component({
  selector: 'app-standard-applicants-view',
  standalone: true,
  imports: [BreadcrumbsComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './standard-applicants-view.component.html',
})
export class StandardApplicantsViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly saApi = inject(StandardApplicantsApi);
  private readonly platformId = inject(PLATFORM_ID);

  code = signal('');
  summaryListValues: StandardApplicantSummaryListValues = {};

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('id') ?? undefined;

    if (!code) {
      void this.router.navigate(['/standard-applicants']);
      return;
    }

    this.code.set(code);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.saApi
      .getStandardApplicantByCode({ code: this.code() }, undefined, undefined, {
        transferCache: false,
      })
      .subscribe({
        next: (response) => {
          this.summaryListValues = this.mapResponseToSummaryList(response);
        },
        error: (err) => {
          const errMsg = getProblemText(err);

          void this.router.navigate(['/standard-applicants'], {
            queryParams: {
              applicantDetailFailedToLoad: 'error',
            },
            state: {
              loadError: errMsg,
            },
          });
        },
      });
  }

  private mapResponseToSummaryList(
    // Accept the legacy payload during FE-first deployment.
    data: StandardApplicantGetDetailDto & { applicant?: Applicant },
  ): StandardApplicantSummaryListValues {
    return {
      standardApplicantName: data.name ?? returnOrgName(data.applicant) ?? '—',
      useFrom: formatDate(data.startDate),
      useTo: formatDate(data.endDate),
    };
  }
}
