import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { buildErrorTextByDomId, errorTextForDomId } from '@util/error-items';

/**
 * OfficialsSectionComponent
 *
 * Functionality:
 * - Displays official details and errors.
 * - Emits a request to save officials.
 * - Can disable the save action while official details are unavailable.
 */
@Component({
  selector: 'app-officials-section',
  imports: [TextInputComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './officials-section.component.html',
})
export class OfficialsSectionComponent {
  readonly group = input.required<FormGroup>();
  readonly errors = input<readonly ErrorItem[]>([]);

  readonly errorByDomId = computed(() => buildErrorTextByDomId(this.errors()));

  readonly saveOfficialsClicked = output<void>();

  readonly disableOfficialButton = input(false);

  errorFor(domId: string): string | null {
    return errorTextForDomId(this.errorByDomId(), domId);
  }

  onSaveOfficials(): void {
    this.saveOfficialsClicked.emit();
  }
}
