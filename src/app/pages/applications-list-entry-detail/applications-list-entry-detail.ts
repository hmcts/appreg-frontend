import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  Inject,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import {
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryUpdateDto,
  UpdateApplicationListEntryRequestParams,
} from '../../../generated/openapi';
import { AccordionComponent } from '../../shared/components/accordion/accordion.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '../../shared/components/error-summary/error-summary.component';
import { NotificationBannerComponent } from '../../shared/components/notification-banner/notification-banner.component';
import { OrganisationSectionComponent } from '../../shared/components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '../../shared/components/person-section/person-section.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import {
  SortableTableComponent,
  TableColumn,
} from '../../shared/components/sortable-table/sortable-table.component';
import { SuccessBannerComponent } from '../../shared/components/success-banner/success-banner.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import {
  CodeRow,
  fetchCodeDetail$,
  fetchCodeRows$,
  titleFromDetail,
  wordingFromDetail,
} from '../../shared/util/application-code-helpers';
import { MojButtonMenuDirective } from '../../shared/util/moj-button-menu';

import {
  SuccessBanner,
  computeSuccessBanner,
  focusSuccessBanner,
} from './util/banners.util';
import {
  APPLICANT_COLUMNS,
  APPLICANT_TYPE_OPTIONS,
  CIVIL_FEE_COLUMNS,
  CODES_COLUMNS,
  FEE_STATUS_OPTIONS,
  PERSON_TITLE_OPTIONS,
  RESPONDENT_TYPE_OPTIONS,
  RESULT_WORDING_COLUMNS,
  WORDING_REF_REGEX,
} from './util/entry-detail.constants';
import { buildEntryDetailForm } from './util/entry-detail.form';
import { mapHttpErrorToSummary } from './util/errors.util';
import { getEntryId } from './util/routing.util';

@Component({
  selector: 'app-applications-list-entry-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
    AccordionComponent,
    SelectInputComponent,
    PersonSectionComponent,
    OrganisationSectionComponent,
    MojButtonMenuDirective,
    SortableTableComponent,
    TextInputComponent,
    DateInputComponent,
    ErrorSummaryComponent,
    NotificationBannerComponent,
    SuccessBannerComponent,
  ],
  templateUrl: './applications-list-entry-detail.html',
})
export class ApplicationsListEntryDetail implements OnInit {
  appListId!: string;

  form!: FormGroup;
  formSubmitted = false;

  // Codes table state
  codesRows: CodeRow[] = [];
  codesLoading = false;
  codesHasSearched = false;

  // Error summary state
  errorHint: string | null = null;
  errorSummary: { text: string; href?: string }[] = [];
  hasFatalError = false;

  // Success banner
  successBanner: SuccessBanner | null = null;

  // View constants (from helpers)
  applicantColumns: TableColumn[] = APPLICANT_COLUMNS;
  codesColumns: TableColumn[] = CODES_COLUMNS;
  civilFeeColumns: TableColumn[] = CIVIL_FEE_COLUMNS;
  resultWordingColumns: TableColumn[] = RESULT_WORDING_COLUMNS;

  feeStatusOptions = FEE_STATUS_OPTIONS;
  applicantEntryTypeOptions = APPLICANT_TYPE_OPTIONS;
  respondentEntryTypeOptions = RESPONDENT_TYPE_OPTIONS;
  personTitleOptions = PERSON_TITLE_OPTIONS;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly entriesApi: ApplicationListEntriesApi,
    private readonly codesApi: ApplicationCodesApi,
    private readonly fb: NonNullableFormBuilder,
  ) {}

  ngOnInit(): void {
    // Resolve Applications List ID
    const nav = this.router.currentNavigation();
    const fromNav = nav?.extras?.state as { appListId?: string } | undefined;
    const fromHist = isPlatformBrowser(this.platformId)
      ? (history.state as { appListId?: string } | undefined)
      : undefined;

    this.appListId =
      fromNav?.appListId ??
      fromHist?.appListId ??
      this.route.snapshot.queryParamMap.get('appListId') ??
      '';

    // Build form via helper
    this.form = buildEntryDetailForm(this.fb);

    // Initial load for Codes section (lodgementDate + applicationCode/title)
    this.loadCodesSection();
  }

  // ── UI handlers ─────────────────────────────────────────────────────────────
  onSubmit(): void {
    this.formSubmitted = true;
  }

  onCodesSearch(): void {
    this.codesHasSearched = true;
    this.codesRows = [];
    this.clearErrors();

    const code = this.readText('applicationCode').trim();
    const title = this.readText('applicationTitle').trim();

    this.codesLoading = true;
    fetchCodeRows$(
      this.codesApi,
      {
        code: code || undefined,
        title: title || undefined,
        page: 0,
        size: 10,
      },
      true,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.codesRows = rows;
          this.codesLoading = false;
        },
        error: (err) => {
          this.codesLoading = false;
          this.applyMappedError(err);
        },
      });
  }

  onAddCode(row: CodeRow): void {
    this.successBanner = null;
    this.clearErrors();

    const entryId = getEntryId(this.route);
    if (!this.appListId || !entryId) {
      return;
    }

    const code = (row?.code ?? '').trim();
    if (!code) {
      return;
    }

    const raw = this.form.getRawValue() as { lodgementDate?: unknown };
    const lodgementDate =
      typeof raw.lodgementDate === 'string'
        ? raw.lodgementDate.slice(0, 10)
        : String(raw.lodgementDate).slice(0, 10);

    if (!lodgementDate) {
      this.hasFatalError = true;
      this.errorHint = 'There is a problem';
      this.errorSummary = [
        {
          text: 'Lodgement date is missing. Load the entry before adding a code.',
        },
      ];
      return;
    }

    const entryUpdateDto: EntryUpdateDto = {
      lodgementDate,
      applicationCode: code,
    };

    const params: UpdateApplicationListEntryRequestParams = {
      listId: this.appListId,
      entryId,
      entryUpdateDto,
    };

    this.entriesApi
      .updateApplicationListEntry(params, 'body', false, {
        transferCache: false,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.afterCodeUpdatedSuccessfully(code, lodgementDate),
        error: (err) => this.applyMappedError(err),
      });
  }

  // Error summary click → move focus/caret to target input
  onErrorItemClick = (err: ErrorItem): void => {
    const href = err?.href ?? '';
    const id = href.startsWith('#') ? href.slice(1) : href;
    if (!id || !isPlatformBrowser(this.platformId)) {
      return;
    }

    setTimeout(() => {
      const el = document.getElementById(id) as
        | (HTMLInputElement & {
            setSelectionRange?: (s: number, e: number) => void;
          })
        | HTMLTextAreaElement
        | null;
      if (!el) {
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus?.();
      try {
        const val = (el as HTMLInputElement).value ?? '';
        if ('setSelectionRange' in el) {
          el.setSelectionRange(val.length, val.length);
        }
      } catch {
        /* no-op */
      }
    });
  };

  get personGroup(): FormGroup {
    return this.form.get('person') as FormGroup;
  }

  get organisationGroup(): FormGroup {
    return this.form.get('organisation') as FormGroup;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────
  private clearErrors(): void {
    this.hasFatalError = false;
    this.errorHint = null;
    this.errorSummary = [];
  }

  private applyMappedError(err: unknown): void {
    const mapped = mapHttpErrorToSummary(err);
    this.hasFatalError = mapped.hasFatalError;
    this.errorHint = mapped.errorHint;
    this.errorSummary = mapped.errorSummary;
  }

  private afterCodeUpdatedSuccessfully(
    code: string,
    lodgementDate: string,
  ): void {
    // Reflect code immediately
    this.form.patchValue({ applicationCode: code });

    // Use helper to fetch code detail and keep the component clean
    fetchCodeDetail$(this.codesApi, code, lodgementDate, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.form.patchValue({ applicationTitle: titleFromDetail(detail) });

          const wording = wordingFromDetail(detail);
          this.successBanner = computeSuccessBanner(wording, WORDING_REF_REGEX);
          focusSuccessBanner(this.platformId);
        },
        error: () => {
          // Still show a generic success banner if the detail lookup fails
          this.successBanner = computeSuccessBanner('', WORDING_REF_REGEX);
          focusSuccessBanner(this.platformId);
        },
      });
  }

  private readText(path: string): string {
    const v: unknown = this.form.get(path)?.value;
    return typeof v === 'string' ? v : '';
  }

  private loadCodesSection(): void {
    const entryId = getEntryId(this.route);
    if (!this.appListId || !entryId) {
      return;
    }

    this.entriesApi
      .getApplicationListEntry(
        { listId: this.appListId, entryId },
        'body',
        false,
        { transferCache: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entry) => {
          const lodgementDate = entry.lodgementDate.slice(0, 10);
          const applicationCode = entry.applicationCode;

          this.form.patchValue({ lodgementDate, applicationCode });

          if (applicationCode && lodgementDate) {
            this.codesApi
              .getApplicationCodeByCodeAndDate(
                { code: applicationCode, date: lodgementDate },
                'body',
                false,
                { transferCache: true },
              )
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (codeDto) => {
                  const title = codeDto.title;
                  this.form.patchValue({ applicationTitle: title });
                },
                error: () => {
                  this.form.patchValue({ applicationTitle: '' });
                },
              });
          }
        },
      });
  }
}
