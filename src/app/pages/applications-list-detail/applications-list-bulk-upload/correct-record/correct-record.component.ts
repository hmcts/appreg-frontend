import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { CorrectionField } from '../util/bulk-upload-corrections';

import { ErrorSummaryComponent } from '@components/error-summary/error-summary.component';

@Component({
  selector: 'app-bulk-upload-correct-record',
  imports: [ErrorSummaryComponent],
  templateUrl: './correct-record.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CorrectRecordComponent implements AfterViewInit {
  readonly rowNumber = input.required<number>();
  readonly fields = input.required<CorrectionField[]>();
  readonly saveRecord = output<ReadonlyMap<number, string>>();
  readonly cancelEdit = output<void>();
  readonly draftChanged = output<boolean>();
  readonly draft = signal<ReadonlyMap<number, string>>(new Map());
  readonly submitAttempt = signal(0);
  readonly localErrors = signal<{ text: string; href: string }[]>([]);
  readonly errorItems = computed(() =>
    this.fields()
      .filter((field) => field.messages.length)
      .map((field) => ({
        text: `${field.label}: ${field.messages.join(' ')}`,
        href: `#csv-field-${field.column}`,
      })),
  );
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.document.getElementById('correct-record-heading')?.focus();
    }
  }

  value(field: CorrectionField): string {
    return this.draft().get(field.column) ?? field.value;
  }

  change(field: CorrectionField, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    const draft = new Map(this.draft());
    if (value === field.value) {
      draft.delete(field.column);
    } else {
      draft.set(field.column, value);
    }
    this.draft.set(draft);
    this.draftChanged.emit(draft.size > 0);
  }

  save(): void {
    this.submitAttempt.update((value) => value + 1);
    const errors = this.fields()
      .filter(
        (field) =>
          field.messages.length && this.value(field).includes('\u0000'),
      )
      .map((field) => ({
        text: `${field.label} contains an unsupported character.`,
        href: `#csv-field-${field.column}`,
      }));
    this.localErrors.set(errors);
    if (!errors.length) {
      this.saveRecord.emit(this.draft());
    }
  }
}
