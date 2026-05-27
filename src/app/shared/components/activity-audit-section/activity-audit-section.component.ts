import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DateInputComponent } from '@components/date-input/date-input.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { isActivityType } from '@components/reports/util';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { ActivityType } from '@openapi';

@Component({
  selector: 'app-activity-audit-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DateInputComponent,
    TextInputComponent,
    SuggestionsComponent,
  ],
  templateUrl: './activity-audit-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityAuditSectionComponent {
  /** Parent passes a nested FormGroup containing controls for this section. */
  readonly group = input.required<FormGroup>();
  readonly submitted = input(false);
  readonly getError = input<((id: string) => ErrorItem | undefined) | null>(
    null,
  );

  readonly activitySearch = signal('');
  readonly activityOptions = Object.values(ActivityType);
  readonly selectedActivities = signal<ActivityType[]>([]);

  readonly activityLabel = (activity: ActivityType): string =>
    activity
      .toLowerCase()
      .split('_')
      .map((part, index) =>
        index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part,
      )
      .join(' ');

  readonly availableActivities = computed(() => {
    const selected = new Set(this.selectedActivities());

    return this.activityOptions.filter((activity) => !selected.has(activity));
  });

  readonly filteredActivities = computed(() => {
    const query = this.normalise(this.activitySearch());

    if (!query) {
      return this.availableActivities();
    }

    return this.availableActivities()
      .filter(
        (activity) =>
          this.normalise(activity).includes(query) ||
          this.normalise(this.activityLabel(activity)).includes(query),
      )
      .slice(0, 20);
  });

  private readonly syncActivitiesFromForm = effect((onCleanup) => {
    const activityControl = this.group().get('activity');

    this.selectedActivities.set(this.coerceActivities(activityControl?.value));

    const subscription = activityControl?.valueChanges.subscribe((value) => {
      this.selectedActivities.set(this.coerceActivities(value));
    });

    onCleanup(() => subscription?.unsubscribe());
  });

  showError = (id: string): boolean =>
    this.submitted() && !!this.getError()?.(id);
  errorText = (id: string): string => this.getError()?.(id)?.text ?? '';

  setActivitySearch(value: string): void {
    this.activitySearch.set(value ?? '');
  }

  selectActivity(item: unknown): void {
    if (!isActivityType(item)) {
      return;
    }

    this.setSelectedActivities([...this.selectedActivities(), item]);
    this.activitySearch.set('');
  }

  removeActivity(activity: ActivityType): void {
    this.setSelectedActivities(
      this.selectedActivities().filter((item) => item !== activity),
    );
  }

  private setSelectedActivities(activities: ActivityType[]): void {
    const next = Array.from(new Set(activities));
    this.selectedActivities.set(next);

    const activityControl = this.group().get('activity');
    activityControl?.setValue(next);
    activityControl?.markAsDirty();
    activityControl?.markAsTouched();
    activityControl?.updateValueAndValidity();
  }

  private coerceActivities(value: unknown): ActivityType[] {
    const values = Array.isArray(value) ? value : [value];

    return Array.from(
      new Set(
        values.filter((item): item is ActivityType => isActivityType(item)),
      ),
    );
  }

  // private isActivityType(value: unknown): value is ActivityType {
  //   return (
  //     typeof value === 'string' &&
  //     this.activityOptions.includes(value as ActivityType)
  //   );
  // }

  private normalise(value: string): string {
    return value.trim().toLowerCase();
  }
}
