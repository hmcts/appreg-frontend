import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';

import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';
import { SummaryListCardActionComponent } from '@components/summary-list-card-action/summary-list-card-action.component';
import { RESPONDENT_ENTRY_ERROR_MESSAGES } from '@constants/application-list-entry/error-messages';
import { RESPONDENT_ORG_ERROR_HREFS } from '@constants/application-list-entry/respondent/error-hrefs';
import { SummaryListCardAction } from '@core-types/summary-list-card-action/summary-list-card.type';
import {
  MultipleRespondentsState,
  RespondentRow,
} from '@services/multiple-respondents.state';
import { buildFormErrorSummary } from '@util/error-summary';

@Component({
  selector: 'app-multiple-respondents',
  imports: [
    OrganisationSectionComponent,
    ErrorSummaryComponent,
    SummaryListCardActionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './multiple-respondents.component.html',
  styleUrl: './multiple-respondents.component.scss',
})
export class MultipleRespondentsComponent {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      if (this.errors().length) {
        untracked(() => {
          const first = this.state().rows()[0];
          if (first) {
            this.selectedId.set(first.id);
            this.state().edit(first.id);
          }
        });
      }
    });
  }

  private readonly selectedId = signal<number | null>(null);
  readonly activeId = computed(() => {
    const rows = this.state().rows();
    return rows.find((row) => row.id === this.selectedId())?.id ?? rows[0]?.id;
  });

  select(id: number): void {
    this.selectedId.set(id);
  }

  tabLabel(row: RespondentRow, index: number): string {
    return row.savedValue?.name || `Organisation ${index + 1}`;
  }

  onTabKeydown(event: KeyboardEvent, index: number): void {
    const rows = this.state().rows();
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % rows.length;
        break;
      case 'ArrowLeft':
        next = (index + rows.length - 1) % rows.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = rows.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.select(rows[next].id);
    this.focus(`respondent-tab-${rows[next].id}`);
  }

  readonly attempted = signal<number[]>([]);
  readonly attempt = signal(0);

  nameId(id: number): string {
    return this.isFirst(id)
      ? 'respondent-org-name'
      : `respondent-extra-${id}-org-name`;
  }

  isFirst(id: number): boolean {
    return this.state().rows()[0]?.id === id;
  }

  private focusName(id: number): void {
    this.focus(this.nameId(id));
  }

  validationErrors(row: RespondentRow): ErrorItem[] {
    if (!this.attempted().includes(row.id)) {
      return [];
    }
    const hrefs = Object.fromEntries(
      Object.entries(RESPONDENT_ORG_ERROR_HREFS).map(([key, href]) => [
        key,
        this.isFirst(row.id)
          ? href
          : href.replace('#respondent-', `#respondent-extra-${row.id}-`),
      ]),
    );
    return buildFormErrorSummary(row.form, RESPONDENT_ENTRY_ERROR_MESSAGES, {
      hrefs,
    });
  }

  fieldErrors(row: RespondentRow): readonly ErrorItem[] {
    return [
      ...(this.isFirst(row.id) ? this.errors() : []),
      ...this.validationErrors(row),
    ];
  }

  summary(row: RespondentRow, index: number): SummaryListCardAction {
    const value = row.form.getRawValue();
    const address = [
      value.addressLine1,
      value.addressLine2,
      value.addressLine3,
      value.addressLine4,
      value.addressLine5,
      value.postcode,
    ]
      .filter((part) => part?.trim())
      .join(', ');
    const contact = [
      { key: 'Phone number', value: value.phoneNumber ?? '' },
      { key: 'Mobile number', value: value.mobileNumber ?? '' },
      { key: 'Email address', value: value.emailAddress ?? '' },
    ].filter((item) => item.value.trim());
    return {
      id: String(row.id),
      title: `Respondent ${index + 1}`,
      content: [
        { key: 'Organisation name', value: value.name },
        { key: 'Address', value: address || 'Not provided' },
        ...contact,
      ],
    };
  }

  complete(id: number): void {
    this.select(id);
    this.attempted.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
    this.attempt.update((value) => value + 1);
    if (this.state().complete(id)) {
      this.attempted.update((ids) => ids.filter((item) => item !== id));
      this.focus(`respondent-card-${id}`);
    }
  }

  edit(id: number): void {
    this.select(id);
    this.state().edit(id);
    this.focusName(id);
  }

  cancelEdit(id: number): void {
    this.select(id);
    this.state().cancelEdit(id);
    this.attempted.update((ids) => ids.filter((item) => item !== id));
    this.focus(`respondent-card-${id}`);
  }

  private focus(id: string): void {
    afterNextRender(() => this.document.getElementById(id)?.focus(), {
      injector: this.injector,
    });
  }

  add(): void {
    this.state().add();
    const rows = this.state().rows();
    this.select(rows[rows.length - 1].id);
    this.focusName(rows[rows.length - 1].id);
  }

  cancelAdding(id: number): void {
    if (this.state().cancelAdding(id)) {
      this.attempted.update((ids) => ids.filter((item) => item !== id));
      this.focusFirstRespondent();
    }
  }

  remove(id: number): void {
    this.state().remove(id);
    this.focus('remove-respondents-heading');
  }

  confirmRemoval(): void {
    this.state().confirmRemoval();
    this.focusFirstRespondent();
  }

  cancelRemoval(): void {
    this.state().cancelRemoval();
    this.focusFirstRespondent();
  }

  private focusFirstRespondent(): void {
    const first = this.state().rows()[0];
    this.select(first.id);
    this.focus(
      first.editing ? this.nameId(first.id) : `respondent-card-${first.id}`,
    );
  }

  readonly state = input.required<MultipleRespondentsState>();
  readonly submitted = input(false);
  readonly errors = input<readonly ErrorItem[]>([]);
}
