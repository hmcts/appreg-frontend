/**
 * Reports page shared form fields:
 *
 * Form: Date from, Date to, projected fields, Court, Other location, CJA
 */

import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';

@Component({
  selector: 'app-reports-shared-form',
  imports: [
    NgTemplateOutlet,
    DateInputComponent,
    TextInputComponent,
    ReactiveFormsModule,
    SuggestionsComponent,
  ],
  templateUrl: './reports-shared-form.component.html',
})
export class ReportsSharedFormComponent {
  group = input.required<FormGroup>();
  suggestions = input.required<SuggestionsFacade>();

  submitted = input(false);
  getError = input<((id: string) => ErrorItem | undefined) | null>(null);
  advancedFilters = input(false);
  advancedOpen = input<boolean | null>(null);
  advancedLabel = input('Advanced filters');
  onToggleAdvanced = input<(() => void) | null>(null);

  private readonly internalAdvancedOpen = signal(false);

  isAdvancedOpen = computed(
    () =>
      (this.advancedOpen() ?? this.internalAdvancedOpen()) ||
      this.hasAdvancedError(),
  );

  showError = (id: string): boolean =>
    this.submitted() && !!this.getError()?.(id);
  errorText = (id: string): string => this.getError()?.(id)?.text ?? '';

  onAdvancedClick(e: Event): void {
    e.preventDefault();

    const toggleAdvanced = this.onToggleAdvanced();
    if (toggleAdvanced) {
      toggleAdvanced();
      return;
    }

    this.internalAdvancedOpen.update((open) => !open);
  }

  private hasAdvancedError(): boolean {
    return this.showError('cja') || this.showError('otherLocation');
  }
}
