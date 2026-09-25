import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  input,
  viewChild,
} from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <dialog
      #dialog
      aria-labelledby="leave-page-title"
      aria-describedby="leave-page-description"
      (cancel)="onCancel($event)"
      (close)="onClose()"
    >
      <div class="dialog-header">
        <button
          type="button"
          class="dialog-close"
          aria-label="Close dialog"
          (click)="dismiss()"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div class="dialog-content">
        <h2 id="leave-page-title" class="govuk-heading-m">{{ heading() }}</h2>
        <p id="leave-page-description" class="govuk-body">{{ message() }}</p>
        <div class="govuk-button-group">
          <button
            type="button"
            class="govuk-button"
            autofocus
            (click)="dismiss()"
          >
            Stay on this page
          </button>
          <button
            type="button"
            class="govuk-button govuk-button--secondary"
            (click)="answer(true)"
          >
            Leave this page
          </button>
        </div>
      </div>
    </dialog>
  `,
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent implements OnDestroy {
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private resolve: ((leave: boolean) => void) | undefined;

  confirm(): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this.dismiss();
      const element = this.dialog().nativeElement;
      this.resolve = (leave) => {
        subscriber.next(leave);
        subscriber.complete();
      };
      element.showModal();
      // ponytail: one dialog at a time; router unsubscription also cleans up superseded navigation.
      return () => {
        this.resolve = undefined;
        element.close();
      };
    });
  }

  answer(leave: boolean): void {
    const resolve = this.resolve;
    this.resolve = undefined;
    resolve?.(leave);
  }

  dismiss(): void {
    this.answer(false);
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.dismiss();
  }

  onClose(): void {
    // A queued close event from a previous navigation must not dismiss a new dialog.
    if (!this.dialog().nativeElement.open) {
      this.dismiss();
    }
  }

  ngOnDestroy(): void {
    this.dismiss();
  }
}
