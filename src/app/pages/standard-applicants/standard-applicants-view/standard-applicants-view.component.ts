import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { StandardApplicantGetDetailDto, StandardApplicantsApi } from '@openapi';
import { getProblemText } from '@util/http-error-to-text';
import { formatDate } from '@util/standard-applicant-helpers';
import { formatPartyName, returnOrgName } from '@util/string-helpers';

interface StandardApplicantSummaryListValues {
  standardApplicantName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressLine3?: string | null;
  addressLine4?: string | null;
  addressLine5?: string | null;
  postcode?: string | null;
  telephoneNumber?: string | null;
  mobileNumber?: string | null;
  emailAddress?: string | null;
  useFrom?: string;
  useTo?: string | null;
}

@Component({
  selector: 'app-standard-applicants-view',
  standalone: true,
  imports: [BreadcrumbsComponent],
  templateUrl: './standard-applicants-view.component.html',
})
export class StandardApplicantsViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly saApi = inject(StandardApplicantsApi);

  code = signal('');
  summaryListValues: StandardApplicantSummaryListValues = {};

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('id') ?? undefined;

    if (!code) {
      void this.router.navigate(['/standard-applicants']);
      return;
    }

    this.code.set(code);

    this.saApi.getStandardApplicantByCode({ code: this.code() }).subscribe({
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
    data: StandardApplicantGetDetailDto,
  ): StandardApplicantSummaryListValues {
    const contactDetails =
      data.applicant?.organisation?.contactDetails ??
      data.applicant?.person?.contactDetails;

    const title = data.applicant?.person?.name.title ?? '';

    let standardApplicantName =
      data.name ??
      returnOrgName(data.applicant) ??
      formatPartyName(data.applicant) ??
      '—';

    if (title !== '') {
      const applicantName = standardApplicantName;
      standardApplicantName = `${title} ${applicantName}`;
    }

    return {
      standardApplicantName,
      addressLine1: contactDetails?.addressLine1 ?? '—',
      addressLine2: contactDetails?.addressLine2 ?? '—',
      addressLine3: contactDetails?.addressLine3 ?? '—',
      addressLine4: contactDetails?.addressLine4 ?? '—',
      addressLine5: contactDetails?.addressLine5 ?? '—',
      postcode: contactDetails?.postcode ?? '—',
      telephoneNumber: contactDetails?.phone ?? '—',
      mobileNumber: contactDetails?.mobile ?? '—',
      emailAddress: contactDetails?.email ?? '—',
      useFrom: formatDate(data.startDate),
      useTo: formatDate(data.endDate),
    };
  }
}
