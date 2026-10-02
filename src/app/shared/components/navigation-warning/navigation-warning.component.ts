import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Observable } from 'rxjs';

import { ConfirmationDialogComponent } from '@components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-navigation-warning',
  standalone: true,
  imports: [ConfirmationDialogComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-confirmation-dialog [heading]="heading()" [message]="message()" />
  `,
})
export class NavigationWarningComponent {
  readonly active = input.required<boolean>();
  readonly heading = input.required<string>();
  readonly message = input.required<string>();

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly dialog = viewChild(ConfirmationDialogComponent);

  constructor() {
    effect((onCleanup) => {
      if (!isPlatformBrowser(this.platformId) || !this.active()) {
        this.dialog()?.dismiss();
        return;
      }

      const window = this.document.defaultView;
      const warnBeforeUnload = (event: BeforeUnloadEvent): void => {
        event.preventDefault();
        event.returnValue = true;
      };
      window?.addEventListener('beforeunload', warnBeforeUnload);
      onCleanup(() =>
        window?.removeEventListener('beforeunload', warnBeforeUnload),
      );
    });
  }

  canLeave(active = this.active()): boolean | Observable<boolean> {
    if (!isPlatformBrowser(this.platformId) || !active) {
      return true;
    }

    return this.dialog()?.confirm() ?? false;
  }
}
