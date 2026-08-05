import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsFacade } from './facade/applications-list-form.facade';

import { DateInputComponent } from '@components/date-input/date-input.component';
import { DurationInputComponent } from '@components/duration-input/duration-input.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import {
  SuggestionsItem,
  isCjaSuggestionItem,
  isCourtSuggestionItem,
} from '@components/suggestions/suggestions.types';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { APPLICATIONS_LIST_CHOOSE_STATUS } from '@constants/applications-list/applications-list.constants';
import {
  ApplicationsListFormControls,
  ApplicationsListFormMode,
  ApplicationsListUpdateFormControls,
} from '@shared-types/applications-list/applications-list-form';
import { ErrorMessageMap, getControlErrorItem } from '@util/error-summary';

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
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './applications-list-form.component.html',
})
export class ApplicationsListFormComponent {
  form = input.required<AppListForm>();

  mode = input<ApplicationsListFormMode>('search');
  submitted = input(false);
  showStatusField = input(true);

  advancedOpen = input(false);
  onToggleAdvanced = input<(() => void) | null>(null);

  suggestions = input.required<SuggestionsFacade>();

  // applications-list-update.component error messages
  hasCloseErrors = input(false);
  closeErrorText = input('');
  updateInvalid = input(false);
  hasDurationCloseError = input(false);
  durationCloseErrorText = input('');

  status = APPLICATIONS_LIST_CHOOSE_STATUS;

  errorMap = input.required<ErrorMessageMap>();
  externalErrors = input<readonly ErrorItem[]>([]);

  isCreate = computed(() => this.mode() === 'create');
  isSearch = computed(() => this.mode() === 'search');
  isUpdate = computed(() => this.mode() === 'update');

  showStatus = computed(
    () => this.showStatusField() && this.mode() !== 'create',
  );
  showDuration = computed(() => this.mode() === 'update');

  showError(id: string): boolean {
    return this.submitted() && !!this.getControlError(id);
  }
  errorText(id: string): string {
    return this.submitted() ? (this.getControlError(id)?.text ?? '') : '';
  }

  onAdvancedClick(e: Event): void {
    e.preventDefault();
    this.onToggleAdvanced()?.();
  }

  onCourthouseSuggestionSelected(item: SuggestionsItem): void {
    if (isCourtSuggestionItem(item)) {
      this.suggestions().selectCourthouse(item);
    }
  }

  onCjaSuggestionSelected(item: SuggestionsItem): void {
    if (isCjaSuggestionItem(item)) {
      this.suggestions().selectCja(item);
    }
  }

  getControlError(id: string): ErrorItem | undefined {
    const control = (this.form() as FormGroup).get(id);

    return (
      getControlErrorItem(control, id, this.errorMap()) ??
      this.externalErrors().find((item) => item.id === id)
    );
  }
}
