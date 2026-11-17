import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import { ALERT_ICON_PATHS, AlertType } from './alert-icons';

/**
 * AlertComponent
 *
 * Functionality:
 * - Displays an alert message.
 * - Supports dismissal and emits dismissal events.
 * - Alert has 4 types which you must provide 1:
 *    - "error"
 *    - "information"
 *    - "success"
 *    - "warning"
 * - You must provide a message
 * - Allows the parent to control whether dismissal is available.
 */
@Component({
  selector: 'app-alert',
  host: {
    '[attr.alerttype]': 'alertType()',
  },
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './alert.component.html',
})
export class AlertComponent {
  readonly alertType = input.required<AlertType>();
  readonly message = input.required<string>();

  readonly title = input<string>('');
  readonly allowDismiss = input<boolean>(false);
  readonly href = input<{ href: string; msg: string }>();
  readonly alertDismissed = output<void>();

  private readonly dismissed = signal(false);

  readonly hasHeading = computed(() => this.title().trim().length > 0);
  readonly iconPath = computed(() => ALERT_ICON_PATHS[this.alertType()]);
  readonly isVisible = computed(() => !this.dismissed());
  readonly ariaLabel = computed(() => {
    const labelText = this.hasHeading() ? this.title() : this.message();

    return `${this.alertType()}: ${labelText}`;
  });

  dismiss(): void {
    if (this.allowDismiss()) {
      this.dismissed.set(true);
      this.alertDismissed.emit();
    }
  }
}
