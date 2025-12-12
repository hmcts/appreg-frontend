import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ErrorSummaryItem } from '../../../core/models/error/error.types';
import {
  addressLine1Missing,
  firstNameMissing,
  lastNameMissing,
} from '../../constants/err-msgs';
import {
  ValidationResult,
  validateOptionalContactFields,
} from '../../util/validation';
import { SelectInputComponent } from '../select-input/select-input.component';
import { TextInputComponent } from '../text-input/text-input.component';

@Component({
  selector: 'app-person-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectInputComponent,
    TextInputComponent,
  ],
  templateUrl: './person-section.component.html',
})
export class PersonSectionComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) titleOptions!: { value: string; label: string }[];
  @Input() submitted = false;
  @Input() errors: Record<string, string> = {};

  /**
   * Run validations for the person section and return:
   * - fieldErrors: map of input id → error message
   * - summaryItems: array usable by app-error-summary
   * - valid: boolean
   *
   */
  validate(): ValidationResult {
    const fieldErrors: Record<string, string> = {};
    const summaryItems: ErrorSummaryItem[] = [];

    const p = this.group.value as Record<string, unknown>;
    const get = (k: string) => {
      const v = p[k];
      return typeof v === 'string' ? v.trim() : '';
    };

    const ids = {
      firstName: 'person-first-name',
      surname: 'person-surname',
      address1: 'person-address-line-1',
      postcode: 'person-postcode',
      phone: 'person-phone-number',
      mobile: 'person-mobile-number',
      email: 'person-email-address',
    };

    const add = (id: string, text: string, href: string) => {
      fieldErrors[id] = text;
      summaryItems.push({ text, href });
    };

    // Required
    if (!get('firstName')) {
      add(ids.firstName, firstNameMissing, '#person-first-name');
    }
    if (!get('surname')) {
      add(ids.surname, lastNameMissing, '#person-surname');
    }
    if (!get('addressLine1')) {
      add(ids.address1, addressLine1Missing, '#person-address-line-1');
    }

    // Optional-but-validated
    validateOptionalContactFields(
      get,
      (name) => this.group.get(name)?.errors ?? null,
      ids,
      add,
    );

    return {
      fieldErrors,
      summaryItems,
      valid: summaryItems.length === 0,
    };
  }
}
