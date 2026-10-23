import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { AccordionComponent } from '@components/accordion/accordion.component';
import { ErrorSummaryComponent } from '@components/error-summary/error-summary.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';

@Component({
  selector: 'app-organisations-prototype',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    AccordionComponent,
    ErrorSummaryComponent,
    OrganisationSectionComponent,
  ],
  templateUrl: './organisations-prototype.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class OrganisationsPrototypeComponent {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private nextId = 1;

  readonly embedded = input(false);
  readonly wordingOpen = signal(true);
  readonly respondentsOpen = signal(true);

  constructor() {
    afterNextRender(() => {
      if (this.embedded()) {
        this.document.getElementById('prototype-heading')?.focus();
      }
    });
  }

  onExpandedChange(change: { index: number; expanded: boolean }): void {
    (change.index === 0 ? this.wordingOpen : this.respondentsOpen).set(
      change.expanded,
    );
  }

  readonly stage = signal<'edit' | 'review' | 'complete'>('edit');
  readonly announcement = signal('');
  readonly submitted = signal(false);
  readonly countSubmitted = signal(false);
  readonly submitCycle = signal(0);
  readonly applicant = new FormControl('', { nonNullable: true });
  readonly accountCount = new FormControl('1', { nonNullable: true });
  readonly organisations = signal([this.newOrganisation()]);
  readonly pendingRemoval = signal<number[]>([]);
  readonly maximumRespondents = 20;

  get requestedCount(): number | null {
    const value = this.accountCount.value.trim();
    const count = Number(value);
    return /^\d+$/.test(value) &&
      Number.isSafeInteger(count) &&
      count >= 1 &&
      count <= this.maximumRespondents
      ? count
      : null;
  }

  get countError(): string | null {
    if (!this.countSubmitted()) {
      return null;
    }
    if (this.requestedCount === null) {
      return `Enter a whole number of accounts between 1 and ${this.maximumRespondents}`;
    }
    return this.requestedCount !== this.organisations().length
      ? 'Update respondents to match the number of accounts'
      : null;
  }

  get errors(): { text: string; href: string }[] {
    const errors = this.countError
      ? [{ text: this.countError, href: '#account-count' }]
      : [];
    if (this.submitted()) {
      errors.push(
        ...this.organisations().flatMap((row, index) =>
          row.form.controls.name.value.trim()
            ? []
            : [
                {
                  text: `Enter an organisation name for respondent ${index + 1}`,
                  href: `#respondent-${row.id}-org-name`,
                },
              ],
        ),
      );
    }
    return errors;
  }

  updateRespondents(): void {
    this.countSubmitted.set(true);
    this.submitCycle.update((cycle) => cycle + 1);
    const count = this.requestedCount;
    this.wordingOpen.set(true);
    this.respondentsOpen.set(true);
    if (count === null) {
      return;
    }
    const rows = this.organisations();
    if (count < rows.length) {
      this.requestRemoval(rows.slice(count).map((row) => row.id));
      return;
    }
    this.organisations.set([
      ...rows,
      ...Array.from({ length: count - rows.length }, () =>
        this.newOrganisation(),
      ),
    ]);
    this.announcement.set(
      `${count} respondent sections. Existing details have been kept.`,
    );
    this.focus(
      count > rows.length
        ? `respondent-${this.organisations()[rows.length].id}-org-name`
        : 'respondents-heading',
    );
  }

  add(): void {
    if (this.organisations().length >= this.maximumRespondents) {
      return;
    }
    this.accountCount.setValue(String(this.organisations().length + 1));
    this.updateRespondents();
  }

  remove(id: number): void {
    if (
      this.organisations().length > 1 &&
      this.organisations().some((row) => row.id === id)
    ) {
      this.requestRemoval([id]);
    }
  }

  confirmRemoval(): void {
    const removed = new Set(this.pendingRemoval());
    this.organisations.update((rows) =>
      rows.filter((row) => !removed.has(row.id)),
    );
    this.accountCount.setValue(String(this.organisations().length));
    this.pendingRemoval.set([]);
    this.announcement.set(
      `${removed.size} respondent sections removed. Number of accounts is now ${this.organisations().length}.`,
    );
    this.focus('respondents-heading');
  }

  cancelRemoval(): void {
    this.wordingOpen.set(true);
    this.pendingRemoval.set([]);
    this.accountCount.setValue(String(this.organisations().length));
    this.focus('account-count');
  }

  review(): void {
    this.wordingOpen.set(true);
    this.respondentsOpen.set(true);
    this.submitted.set(true);
    this.countSubmitted.set(true);
    this.submitCycle.update((cycle) => cycle + 1);
    if (this.errors.length || this.pendingRemoval().length) {
      return;
    }
    this.organisations().forEach((row) =>
      row.form.controls.name.setValue(row.form.controls.name.value.trim()),
    );
    this.stage.set('review');
    this.focus('prototype-heading');
  }

  edit(id?: number): void {
    this.wordingOpen.set(true);
    this.respondentsOpen.set(true);
    this.stage.set('edit');
    this.submitted.set(false);
    this.focus(
      id === undefined ? 'account-count' : `respondent-${id}-org-name`,
    );
  }

  finish(): void {
    this.stage.set('complete');
    this.focus('prototype-heading');
  }

  restart(): void {
    this.organisations.set([this.newOrganisation()]);
    this.accountCount.setValue('1');
    this.applicant.reset();
    this.countSubmitted.set(false);
    this.pendingRemoval.set([]);
    this.announcement.set('Prototype restarted.');
    this.edit();
  }

  private requestRemoval(ids: number[]): void {
    this.pendingRemoval.set(ids);
    this.focus('remove-heading');
  }

  private newOrganisation() {
    const control = () => new FormControl('', { nonNullable: true });
    return {
      id: this.nextId++,
      form: new FormGroup({
        name: control(),
        addressLine1: control(),
        addressLine2: control(),
        addressLine3: control(),
        addressLine4: control(),
        addressLine5: control(),
        postcode: control(),
        phoneNumber: control(),
        mobileNumber: control(),
        emailAddress: control(),
      }),
    };
  }

  private focus(id: string): void {
    afterNextRender(() => this.document.getElementById(id)?.focus(), {
      injector: this.injector,
    });
  }
}
