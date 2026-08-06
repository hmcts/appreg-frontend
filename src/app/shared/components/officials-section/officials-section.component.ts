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

  errorFor(domId: string): string | null {
    return errorTextForDomId(this.errorByDomId(), domId);
  }

  onSaveOfficials(): void {
    this.saveOfficialsClicked.emit();
  }
}
