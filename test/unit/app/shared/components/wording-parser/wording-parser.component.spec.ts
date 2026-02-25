import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { WordingParserComponent } from '@components/wording-parser/wording-parser.component';
import { TemplateConstraintTypeEnum, TemplateDetail } from '@openapi';

describe('WordingParserComponent', () => {
  let component: WordingParserComponent;
  let fixture: ComponentFixture<WordingParserComponent>;

  const makeWordingObject = (
    overrides?: Partial<TemplateDetail>,
  ): TemplateDetail =>
    ({
      template: 'Hello {{ Applicant officer }} on {{date}}.',
      'substitution-key-constraints': [
        {
          key: 'Applicant officer',
          value: '12345678',
          constraint: { length: 12 },
        },
        { key: 'date', value: '31/12/2026', constraint: { length: 10 } },
      ],
      ...(overrides ?? {}),
    }) as unknown as TemplateDetail;

  const init = (wordingObject: TemplateDetail, submitAttempt = 0) => {
    fixture = TestBed.createComponent(WordingParserComponent);
    component = fixture.componentInstance;

    // REQUIRED inputs
    fixture.componentRef.setInput('wordingObject', wordingObject);
    fixture.componentRef.setInput('submitAttempt', submitAttempt);

    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordingParserComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(WordingParserComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('wordingObject', {
      template: 'Hello {{name}}',
      'substitution-key-constraints': [
        { key: 'name', value: '', constraint: { length: 50 } },
      ],
    } as unknown as TemplateDetail);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('tokenize()', () => {
    it('should tokenize text and inputs correctly', () => {
      init(
        makeWordingObject({
          template:
            'Enter a {{ Applicant Officer}} name change effective {{ Date }}',
        }),
      );

      expect(component.tokens).toEqual([
        { type: 'text', value: 'Enter a ' },
        { type: 'input', key: 'Applicant Officer' },
        { type: 'text', value: ' name change effective ' },
        { type: 'input', key: 'Date' },
      ]);
    });

    it('should return only text token when no placeholders', () => {
      init(makeWordingObject({ template: 'Only text' }));

      expect(component.tokens).toEqual([{ type: 'text', value: 'Only text' }]);
    });

    it('should return empty array for empty template', () => {
      init(makeWordingObject({ template: '' }));
      expect(component.tokens).toEqual([]);
    });
  });

  describe('form initialization', () => {
    it('should create controls for input tokens and patch values', () => {
      init(makeWordingObject());

      expect(component.form.contains('Applicant officer')).toBe(true);
      expect(component.form.contains('date')).toBe(true);

      expect(component.form.get('Applicant officer')?.value).toBe('12345678');
      expect(component.form.get('date')?.value).toBe('31/12/2026');
    });

    it('should not patch value if constraint has no value', () => {
      init(
        makeWordingObject({
          'substitution-key-constraints': [
            {
              key: 'Applicant officer',
              value: '',
              constraint: { length: 12, type: TemplateConstraintTypeEnum.TEXT },
            },
            {
              key: 'date',
              value: '',
              constraint: { length: 10, type: TemplateConstraintTypeEnum.TEXT },
            },
          ],
        }),
      );

      expect(component.form.get('Applicant officer')?.value).toEqual('');
      expect(component.form.get('date')?.value).toEqual('');
    });

    it('should not create controls if no input tokens', () => {
      init(makeWordingObject({ template: 'No placeholders' }));

      expect(Object.keys(component.form.controls)).toHaveLength(0);
    });
  });

  describe('isSaveDisabled()', () => {
    it('should return true if input tokens exist', () => {
      init(makeWordingObject({ template: 'Hi {{A}}' }));
      expect(component.isSaveDisabled()).toBe(true);
    });

    it('should return false if no input tokens', () => {
      init(makeWordingObject({ template: 'Just text' }));
      expect(component.isSaveDisabled()).toBe(false);
    });
  });

  describe('submitWordingFields()', () => {
    it('should emit required errors in token order when invalid', () => {
      init(
        makeWordingObject({
          template: 'Hi {{A}} then {{B}}',
          'substitution-key-constraints': [
            {
              key: 'A',
              value: '',
              constraint: { length: 5, type: TemplateConstraintTypeEnum.TEXT },
            },
            {
              key: 'B',
              value: '',
              constraint: { length: 5, type: TemplateConstraintTypeEnum.TEXT },
            },
          ],
        }),
      );

      const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');
      const dtoSpy = jest.spyOn(component.wordingFieldsDTO, 'emit');

      (
        component.form.get('A') as unknown as FormControl<string | null>
      ).setValue('');
      (
        component.form.get('B') as unknown as FormControl<string | null>
      ).setValue('');

      component.submitWordingFields();

      expect(dtoSpy).not.toHaveBeenCalled();

      expect(errorsSpy).toHaveBeenCalledWith([
        { text: 'Wording section - Enter a A', href: '#A' },
        { text: 'Wording section - Enter a B', href: '#B' },
      ]);
    });

    it('should emit maxlength error when value exceeds constraint', () => {
      init(
        makeWordingObject({
          template: 'Hi {{A}}',
          'substitution-key-constraints': [
            {
              key: 'A',
              value: '',
              constraint: { length: 3, type: TemplateConstraintTypeEnum.TEXT },
            },
          ],
        }),
      );

      const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');

      (
        component.form.get('A') as unknown as FormControl<string | null>
      ).setValue('TOOLONG');

      component.submitWordingFields();

      expect(errorsSpy).toHaveBeenCalledWith([
        {
          text: 'Wording section - A must be 3 characters or fewer',
          href: '#A',
        },
      ]);
    });

    it('should emit DTO and empty errors when valid', () => {
      init(makeWordingObject());

      const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');
      const dtoSpy = jest.spyOn(component.wordingFieldsDTO, 'emit');

      component.submitWordingFields();

      expect(errorsSpy).toHaveBeenCalledWith([]);
      expect(dtoSpy).toHaveBeenCalledWith({
        wordingFields: [
          { key: 'Applicant officer', value: '12345678' },
          { key: 'date', value: '31/12/2026' },
        ],
      });
    });
  });

  describe('unknown validation error branch', () => {
    it('should emit "Check key" for unknown validator errors', () => {
      init(
        makeWordingObject({
          template: 'Hi {{A}}',
          'substitution-key-constraints': [
            {
              key: 'A',
              value: '123',
              constraint: { length: 5, type: TemplateConstraintTypeEnum.TEXT },
            },
          ],
        }),
      );

      const control = component.form.get('A');
      control?.addValidators(() => ({ customError: true }));
      control?.updateValueAndValidity();

      const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');

      component.submitWordingFields();

      expect(errorsSpy).toHaveBeenCalledWith([{ text: 'Check A', href: '#A' }]);
    });
  });

  describe('submitAttempt signal effect', () => {
    it('should emit errors when submitAttempt increments and form invalid', () => {
      init(
        makeWordingObject({
          template: 'Hi {{A}}',
          'substitution-key-constraints': [
            {
              key: 'A',
              value: '',
              constraint: { length: 5, type: TemplateConstraintTypeEnum.TEXT },
            },
          ],
        }),
      );

      const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');

      (
        component.form.get('A') as unknown as FormControl<string | null>
      ).setValue('');

      fixture.componentRef.setInput('submitAttempt', 1);
      fixture.detectChanges();

      expect(errorsSpy).toHaveBeenCalledWith([
        { text: 'Wording section - Enter a A', href: '#A' },
      ]);
    });

    it('should emit empty array when submitAttempt increments and form valid', () => {
      init(
        makeWordingObject({
          template: 'Hi {{A}}',
          'substitution-key-constraints': [
            {
              key: 'A',
              value: 'OK',
              constraint: { length: 5, type: TemplateConstraintTypeEnum.TEXT },
            },
          ],
        }),
      );

      const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');

      fixture.componentRef.setInput('submitAttempt', 1);
      fixture.detectChanges();

      expect(errorsSpy).toHaveBeenCalledWith([]);
    });
  });
});
