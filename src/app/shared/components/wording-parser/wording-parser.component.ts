import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
})
export class WordingParserComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  wordingObject = input.required<TemplateDetail>();
  wordingSubmitAttempt = input(0);
  showSaveButton = input(true);
  section = input('wording');

  wordingFieldErrors = output<ErrorItem[]>();
  wordingFieldsDTO = output<{ wordingFields: TemplateSubstitution[] }>();

  private readonly normalisedKeyToKeyMap = new Map<string, string>();
  private lastHandledAttempt = 0;

  submitted = signal(false);

  tokens: Token[] = [];

  isSaveDisabled = computed(() =>
    this.tokens.some((token) => token.type === 'input'),
  );

  form = this.fb.group({});

  constructor() {
    effect(() => {
      const attempt = this.wordingSubmitAttempt();
      if (attempt === 0 || attempt === this.lastHandledAttempt) {
        return;
      }

      this.lastHandledAttempt = attempt;

      if (this.showSaveButton()) {
        this.submitted.set(true);
        this.form.markAllAsTouched();
        this.form.updateValueAndValidity({ emitEvent: false });
        this.wordingFieldErrors.emit(this.form.valid ? [] : this.buildErrors());
        return;
      }

      this.submitWordingFields();
    });
  }

  ngOnInit(): void {
    this.tokens = this.tokenize(this.wordingObject().template ?? '');

    this.createFormControls();
    this.patchFormControls();

    // In no-save-button mode (used by result wording cards), emit live draft values
    // so parent components can detect edits and enable submit actions.
    if (!this.showSaveButton()) {
      this.form.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.wordingFieldsDTO.emit(this.toWordingFields(this.form));
        });
    }
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

    this.normalisedKeyToKeyMap.clear();

    this.tokens.forEach((token) => {
      if (token.type === 'input') {
        const formKey = this.normaliseKey(token.key);

        this.normalisedKeyToKeyMap.set(formKey, token.key);

        const maxLength = constraintLengths[token.key];

        this.form.addControl(
          formKey,
          this.fb.control('', {
            validators: [
              (control: AbstractControl) => Validators.required(control),
              (control: AbstractControl) =>
                Validators.maxLength(maxLength)(control),
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

      const formKey = this.normaliseKey(item.key);
      this.form.get(formKey)?.setValue(item.value);
    });
  }

  tokenize(template: string): Token[] {
    const tokens: Token[] = [];
    const wordingTemplateTokenizerRegex =
      /\{\{[ \t]{0,50}([^{}\r\n]{1,256})[ \t]{0,50}\}\}/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = wordingTemplateTokenizerRegex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          value: template.slice(lastIndex, match.index),
        });
      }

      tokens.push({ type: 'input', key: (match[1] ?? '').trim() });
      lastIndex = wordingTemplateTokenizerRegex.lastIndex;
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
        key: this.normalisedKeyToKeyMap.get(key),
        value: value ?? '',
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
      const formKey = this.normaliseKey(key);

      const control = this.form.get(formKey);
      if (!control) {
        continue;
      }

      const e: ValidationErrors | null = control.errors;
      if (!e) {
        continue;
      }

      if (e['required']) {
        errors.push({
          text: `Enter a ${key} in the ${this.section()} section`,
          href: `#${formKey}`,
        });
      }

      if (e['maxlength']) {
        const max = (
          control.getError('maxlength') as { requiredLength: number } | null
        )?.requiredLength;

        if (max !== null) {
          errors.push({
            text: `${key} in the ${this.section()} section must be ${max} characters or fewer`,
            href: `#${formKey}`,
          });
        }
      }
    }

    return errors;
  }

  // converts string e.g. No. of accounts into No-of-accounts to be used as form control keys and in error hrefs,
  // as spaces and full stops are not valid in form control names or html ids
  normaliseKey(key: string): string {
    return key.replaceAll('.', '').trim().replaceAll(/\s+/g, '-');
  }
}
