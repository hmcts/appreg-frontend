import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, Subscription, merge, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
} from 'rxjs/operators';

import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import {
  ApplicationCodeGetSummaryDto,
  ApplicationCodesApi,
  GetApplicationCodesRequestParams,
} from '@openapi';

@Component({
  selector: 'app-application-code-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NotificationBannerComponent,
    TextInputComponent,
  ],
  templateUrl: './application-codes-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationCodeSearchComponent implements OnInit, OnDestroy {
  @Input() debounceMs = 300; // Debounce typing before querying (ms) (important for auto)
  @Input() minChars = 3; // Min chars before we run the query (important for auto)
  @Input() auto = true; // True = query whilst typing, false = action button only
  @Input() legend = 'Find an application code';
  @Input() codePlaceholder = 'Enter code (e.g. APP01)';
  @Input() titlePlaceholder = 'Enter application code title';

  // Emit row
  @Output() selectCode = new EventEmitter<ApplicationCodeGetSummaryDto>();
  // Emit latest result set after each search
  @Output() resultsChange = new EventEmitter<ApplicationCodeGetSummaryDto[]>();

  submitted: boolean = false;

  form = new FormGroup({
    code: new FormControl<string | null>(null),
    title: new FormControl<string | null>(null),
  });

  loading = false;
  errored = false;
  results: ApplicationCodeGetSummaryDto[] = [];

  private readonly runSearch$ = new Subject<void>();
  private sub?: Subscription;

  constructor(
    private readonly api: ApplicationCodesApi,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.submitted = false;
    const fv$ = this.form.valueChanges.pipe(
      debounceTime(this.debounceMs),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      map(() => void 0),
    );

    const trigger$ = this.auto ? merge(fv$, this.runSearch$) : this.runSearch$;

    this.sub = trigger$
      .pipe(
        switchMap(() => {
          const params = this.buildParams();
          if (!params && this.auto) {
            this.results = [];
            this.errored = false;
            this.loading = false;
            this.cdr.markForCheck();
            return of<ApplicationCodeGetSummaryDto[]>([]);
          }

          const p: GetApplicationCodesRequestParams = params ?? {};
          this.loading = true;
          this.errored = false;
          this.cdr.markForCheck();

          return this.api
            .getApplicationCodes(p, 'body', false, { transferCache: false })
            .pipe(
              map((page) => page?.content ?? []),
              catchError(() => {
                this.errored = true;
                return of<ApplicationCodeGetSummaryDto[]>([]);
              }),
            );
        }),
      )
      .subscribe((rows) => {
        this.loading = false;
        this.results = rows;
        this.resultsChange.emit(rows);
        this.cdr.markForCheck();
        this.submitted = true;
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // When we manually click search we want to run the query
  search(): void {
    this.runSearch$.next();
    this.submitted = true;
  }

  choose(row: ApplicationCodeGetSummaryDto): void {
    this.selectCode.emit(row);
    this.submitted = false;
  }

  clear(): void {
    this.form.patchValue({ code: null, title: null }, { emitEvent: false });
    this.results = [];
    this.errored = false;
    this.cdr.markForCheck();
    this.submitted = false;
  }

  private buildParams(): GetApplicationCodesRequestParams | null {
    const code = (this.form.value.code ?? '').trim();
    const title = (this.form.value.title ?? '').trim();
    const totalLen = code.length + title.length;

    if (!code && !title) {
      return null;
    }
    if (this.auto && totalLen < this.minChars) {
      return null;
    }

    const params: GetApplicationCodesRequestParams = {};
    if (code) {
      params.code = code;
    }
    if (title) {
      params.title = title;
    }
    return params;
  }

  // TODO: We need to emit an event for when table is moved
}
