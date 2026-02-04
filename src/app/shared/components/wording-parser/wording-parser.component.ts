import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

type Token = { type: 'text'; value: string } | { type: 'input'; key: string };

interface SubstitutionKeyConstraint {
  key: string;
  value: string;
  constraint?: {
    type: 'TEXT';
    length: number;
  };
}

interface WordingConfig {
  template: string;
  'substitution-key-constraints': SubstitutionKeyConstraint[];
}

@Component({
  selector: 'app-wording-parser',
  imports: [ReactiveFormsModule],
  templateUrl: './wording-parser.component.html',
  styleUrl: './wording-parser.component.scss',
})
export class WordingParserComponent implements OnInit {
  private fb = inject(FormBuilder);

  tokens: Token[] = [
    { type: 'text', value: 'This is a test ' },
    { type: 'input', key: 'Applicant officer' },
    { type: 'text', value: ' with a date' },
  ];

  form = this.fb.group({});

  ngOnInit(): void {
    const token1 = this.tokenize(this.value1.wording.template);
    const token2 = this.tokenize(this.value2.wording.template);
    const token3 = this.tokenize(this.value3.wording.template);

    this.tokens = token2;

    console.log(
      this.tokenize('This is a test {{Applicant officer}} with a {{date}}'),
    );

    console.log('Tokens 1:', token1);
    console.log('Tokens 2:', token2);
    console.log('Tokens 3:', token3);
    this.createFormControls();
    this.setFormControls();
  }

  createFormControls(): void {
    this.tokens.forEach((token) => {
      if (token.type === 'input') {
        this.form.addControl(
          token.key,
          this.fb.control('', {
            validators: [
              (control: AbstractControl) => Validators.required(control),
              (control: AbstractControl) => Validators.maxLength(100)(control),
            ],
          }),
        );
      }
    });

    console.log('Form Controls:', this.form.controls);
  }

  setFormControls(): void {
    const constraints =
      this.value2.wording['substitution-key-constraints'] ?? [];

    if (!constraints.length) {
      return;
    }

    constraints.forEach((item) => {
      if (this.form.contains(item.key)) {
        this.form.get(item.key)?.setValue(item.value);
      }
    });
  }

  tokenize(template: string): Token[] {
    const tokens: Token[] = [];
    const regex = /\{\{\s*([^}]+?)\s*\}\}/g;

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

  value1: { wording: WordingConfig } = {
    wording: {
      template: 'This is a test {{Applicant officer}} with a date',
      'substitution-key-constraints': [
        {
          key: 'Applicant officer',
          value: '12345678',
          constraint: {
            type: 'TEXT',
            length: 1234,
          },
        },
      ],
    },
  };

  value2: { wording: WordingConfig } = {
    wording: {
      template: 'This is a test {{Applicant officer}} with a {{date}}',
      'substitution-key-constraints': [
        {
          key: 'Applicant officer',
          // value: '12345678',
          value: '',
          constraint: {
            type: 'TEXT',
            length: 1234,
          },
        },
        {
          key: 'date',
          // value: '31/12/2026',
          value: '',
          constraint: {
            type: 'TEXT',
            length: 1234,
          },
        },
      ],
    },
  };

  value3: { wording: WordingConfig } = {
    wording: {
      template:
        'Attends to make a statutory declaration that henceforth the applicant will be known as Bob Smith.',
      'substitution-key-constraints': [],
    },
  };
}
