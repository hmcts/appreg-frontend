import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { TemplateDetail, TemplateSubstitution } from '@openapi';

export type Token =
  | { type: 'text'; value: string }
  | { type: 'input'; key: string };

@Component({
  selector: 'app-wording-parser',
  imports: [ReactiveFormsModule],
  templateUrl: './wording-parser.component.html',
  styleUrl: './wording-parser.component.scss',
})
export class WordingParserComponent implements OnInit {
  private fb = inject(FormBuilder);
  wordingObject = input.required<TemplateDetail>();

  wordingFieldErrors = output<ErrorItem[]>();
  wordingFieldsDTO = output<{ wordingFields: TemplateSubstitution[] }>();

  submitAttempt = input(0);
  submitted = signal(false);

  tokens: Token[] = [];

  isSaveDisabled = computed(() =>
    this.tokens.some((token) => token.type === 'input'),
  );

  form = this.fb.group({});

  constructor() {
    effect(() => {
      const attempt = this.submitAttempt();
      if (attempt === 0) {
        return;
      }

      this.submitted.set(true);

      this.form.markAllAsTouched();
      this.form.updateValueAndValidity({ emitEvent: false });

      this.wordingFieldErrors.emit(this.form.valid ? [] : this.buildErrors());
    });
  }

  ngOnInit(): void {
    this.tokens = this.tokenize(this.wordingObject().template ?? '');

    this.createFormControls();
    this.patchFormControls();
  }

  createFormControls(): void {
    // create an array where the key is the substitution key and the value is the constraint length
    // e.g. "Date": 10

    const constraintLengths = (
      this.wordingObject()['substitution-key-constraints'] ?? []
    ).reduce<Record<string, number>>((acc, item) => {
      if (item.key) {
        acc[item.key] = item.constraint.length;
      }
      return acc;
    }, {});

    this.tokens.forEach((token) => {
      if (token.type === 'input') {
        this.form.addControl(
          token.key,
          this.fb.control('', {
            validators: [
              (control: AbstractControl) => Validators.required(control),
              (control: AbstractControl) =>
                Validators.maxLength(constraintLengths[token.key])(control),
            ],
          }),
        );
      }
    });
  }

  patchFormControls(): void {
    const constraints =
      this.wordingObject()['substitution-key-constraints'] ?? [];

    if (!constraints.length) {
      return;
    }

    constraints.forEach((item) => {
      if (!item.key) {
        return;
      }

      if (this.form.contains(item.key)) {
        this.form.get(item.key)?.setValue(item.value);
      }
    });
  }

  tokenize(template: string): Token[] {
    const tokens: Token[] = [];
    const regex = /\{\{([^}]*)\}\}/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          value: template.slice(lastIndex, match.index),
        });
      }

      tokens.push({ type: 'input', key: (match[1] ?? '').trim() });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < template.length) {
      tokens.push({ type: 'text', value: template.slice(lastIndex) });
    }

    return tokens;
  }

  submitWordingFields(): void {
    this.submitted.set(true);

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    if (this.form.valid) {
      this.wordingFieldErrors.emit([]);
      this.wordingFieldsDTO.emit(this.toWordingFields(this.form));
    } else {
      this.wordingFieldErrors.emit(this.buildErrors());
    }
  }

  private toWordingFields(form: FormGroup): {
    wordingFields: TemplateSubstitution[];
  } {
    const formValue = form.value as Record<string, string>;

    return {
      wordingFields: Object.entries(formValue).map(([key, value]) => ({
        key,
        value,
      })),
    };
  }

  private buildErrors(): ErrorItem[] {
    const errors: ErrorItem[] = [];

    // Deterministic order: follow token order (better UX than Object.keys)
    const inputKeysInOrder = this.tokens
      .filter((t): t is { type: 'input'; key: string } => t.type === 'input')
      .map((t) => t.key);

    for (const key of inputKeysInOrder) {
      const control = this.form.get(key);
      if (!control) {
        continue;
      }

      const e: ValidationErrors | null = control.errors;
      if (!e) {
        continue;
      }

      if (e['required']) {
        errors.push({
          text: `Wording section - Enter a ${key}`,
          href: `#${key}`,
        });
      }

      if (e['maxlength']) {
        const max = (
          control.getError('maxlength') as { requiredLength: number } | null
        )?.requiredLength;

        if (max !== null) {
          errors.push({
            text: `Wording section - ${key} must be ${max} characters or fewer`,
            href: `#${key}`,
          });
        }
      }

      const known = new Set(['required', 'maxlength']);
      const otherKey = Object.keys(e).find((k) => !known.has(k));
      if (otherKey) {
        errors.push({
          text: `Check ${key}`,
          href: `#${key}`,
        });
      }
    }

    return errors;
  }
}
