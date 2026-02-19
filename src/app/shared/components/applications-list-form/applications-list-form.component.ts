import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsFacade } from './facade/applications-list-form.facade';

import { APPLICATIONS_LIST_CHOOSE_STATUS } from '@components/applications-list/util/applications-list.constants';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { DurationInputComponent } from '@components/duration-input/duration-input.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import {
  ApplicationsListFormControls,
  ApplicationsListFormMode,
  ApplicationsListUpdateFormControls,
} from '@shared-types/applications-list/applications-list-form';

type AppListForm =
  | FormGroup<ApplicationsListFormControls>
  | FormGroup<ApplicationsListUpdateFormControls>;

@Component({
  selector: 'app-applications-list-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DateInputComponent,
    DurationInputComponent,
    TextInputComponent,
    SuggestionsComponent,
    SelectInputComponent,
  ],
  templateUrl: './applications-list-form.component.html',
})
export class ApplicationsListFormComponent {
  form = input.required<AppListForm>();

  mode = input<ApplicationsListFormMode>('search');
  submitted = input(false);

  advancedOpen = input(false);
  onToggleAdvanced = input<(() => void) | null>(null);

  suggestions = input.required<SuggestionsFacade>();

  status = APPLICATIONS_LIST_CHOOSE_STATUS;

  isCreate = computed(() => this.mode() === 'create');
  isSearch = computed(() => this.mode() === 'search');
  isUpdate = computed(() => this.mode() === 'update');

  showStatus = computed(() => this.mode() !== 'create');
  showDuration = computed(() => this.mode() === 'update');

  getError = input<((id: string) => ErrorItem | undefined) | null>(null);

  showError = (id: string): boolean =>
    this.submitted() && !!this.getError()?.(id);
  errorText = (id: string): string => this.getError()?.(id)?.text ?? '';

  onAdvancedClick(e: Event): void {
    e.preventDefault();
    this.onToggleAdvanced()?.();
  }
}
