import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  ValidationResult,
  validateOptionalContactFields,
} from '../../util/validation';
import { TextInputComponent } from '../text-input/text-input.component';

type ErrorSummaryItem = { text: string; href: string };

@Component({
  selector: 'app-organisation-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextInputComponent],
  templateUrl: './organisation-section.component.html',
})
export class OrganisationSectionComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input() submitted = false;
  @Input() errors: Record<string, string> = {};
  organisationFieldErrors: Record<string, string> = {};
  errorSummary: ErrorSummaryItem[] = [];

  /**
   * Run validation for the organisation section.
   * Returns fieldErrors + summaryItems + valid flag
   * so the parent can consume them.
   */
  validate(): ValidationResult {
    this.organisationFieldErrors = {};
    this.errorSummary = [];

    const raw = this.group.getRawValue() as Record<string, string | undefined>;
    const get = (k: string): string => {
      const v = raw[k];
      return typeof v === 'string' ? v.trim() : '';
    };

    const ids = {
      name: 'org-name',
      address1: 'org-address-line-1',
      postcode: 'org-postcode',
      phone: 'org-phone-number',
      mobile: 'org-mobile-number',
      email: 'org-email-address',
    };

    const add = (id: string, text: string, href: string) => {
      this.organisationFieldErrors[id] = text;
      this.errorSummary.push({ text, href });
    };

    // Required
    if (!get('name')) {
      add(ids.name, 'Enter an organisation name', '#org-name');
    }
    if (!get('addressLine1')) {
      add(ids.address1, 'Enter address line 1', '#org-address-line-1');
    }

    // Optional-but-validated
    validateOptionalContactFields(
      get,
      (name) => this.group.get(name)?.errors ?? null,
      ids,
      add,
    );

    return {
      fieldErrors: this.organisationFieldErrors,
      summaryItems: this.errorSummary,
      valid: this.errorSummary.length === 0,
    };
  }
}
