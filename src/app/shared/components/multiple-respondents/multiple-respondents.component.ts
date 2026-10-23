import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  inject,
  input,
} from '@angular/core';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';
import { MultipleRespondentsState } from '@services/multiple-respondents.state';

@Component({
  selector: 'app-multiple-respondents',
  imports: [OrganisationSectionComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <p class="govuk-visually-hidden" role="status">
      {{ state().announcement() }}
    </p>
    @if (state().countError()) {
      <p class="govuk-error-message">{{ state().countError() }}</p>
    }
    @if (state().pending().length) {
      <div
        class="govuk-inset-text"
        role="region"
        aria-label="Confirm respondent removal"
      >
        <h3
          class="govuk-heading-m"
          id="remove-respondents-heading"
          tabindex="-1"
        >
          Remove these respondents?
        </h3>
        <ul class="govuk-list govuk-list--bullet">
          @for (row of state().rows(); track row.id; let i = $index) {
            @if (state().pending().includes(row.id)) {
              <li>
                Respondent {{ i + 1 }}:
                {{
                  row.form.controls.name.value || 'No organisation name entered'
                }}
              </li>
            }
          }
        </ul>
        <p class="govuk-body">
          Their names, addresses and contact details will be removed.
        </p>
        <div class="govuk-button-group">
          <button
            class="govuk-button govuk-button--warning"
            type="button"
            (click)="confirmRemoval()"
          >
            Remove respondents
          </button>
          <button
            class="govuk-button govuk-button--secondary"
            type="button"
            (click)="cancelRemoval()"
          >
            Keep respondents
          </button>
        </div>
      </div>
    }
    @for (row of state().rows(); track row.id; let i = $index) {
      <section [attr.aria-labelledby]="'multiple-respondent-' + row.id">
        <h3 class="govuk-heading-m" [id]="'multiple-respondent-' + row.id">
          Respondent {{ i + 1 }}
        </h3>
        <p class="govuk-body">Organisation</p>
        <app-organisation-section
          [group]="row.form"
          [scopeId]="row.id === 0 ? 'respondent' : 'respondent-extra-' + row.id"
          [submitted]="submitted()"
          [errors]="row.id === 0 ? errors() : []"
        />
        @if (state().rows().length > 1) {
          <button
            class="govuk-button govuk-button--secondary"
            type="button"
            (click)="remove(row.id)"
          >
            Remove<span class="govuk-visually-hidden">
              respondent {{ i + 1 }}</span
            >
          </button>
        }
      </section>
      <hr
        class="govuk-section-break govuk-section-break--l govuk-section-break--visible"
      />
    }
    @if (state().rows().length < 20) {
      <button
        class="govuk-button govuk-button--secondary"
        type="button"
        (click)="add()"
      >
        Add another organisation
      </button>
    }
    <p class="govuk-hint">
      Adding or removing an organisation also updates the number of accounts in
      Wording. This local prototype supports up to 20 respondents.
    </p>
  `,
})
export class MultipleRespondentsComponent {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  private focusName(id: number): void {
    this.focus(
      id === 0 ? 'respondent-org-name' : `respondent-extra-${id}-org-name`,
    );
  }

  private focus(id: string): void {
    afterNextRender(() => this.document.getElementById(id)?.focus(), {
      injector: this.injector,
    });
  }

  add(): void {
    this.state().add();
    const rows = this.state().rows();
    this.focusName(rows[rows.length - 1].id);
  }

  remove(id: number): void {
    this.state().remove(id);
    this.focus('remove-respondents-heading');
  }

  confirmRemoval(): void {
    this.state().confirmRemoval();
    this.focusName(0);
  }

  cancelRemoval(): void {
    this.state().cancelRemoval();
    this.focusName(0);
  }

  readonly state = input.required<MultipleRespondentsState>();
  readonly submitted = input(false);
  readonly errors = input<readonly ErrorItem[]>([]);
}
