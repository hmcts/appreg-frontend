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
      ...overrides,
    }) as unknown as TemplateDetail;

  const init = (wordingObject: TemplateDetail, wordingSubmitAttempt = 0) => {
    fixture = TestBed.createComponent(WordingParserComponent);
    component = fixture.componentInstance;

    // REQUIRED inputs
    fixture.componentRef.setInput('wordingObject', wordingObject);
    fixture.componentRef.setInput('wordingSubmitAttempt', wordingSubmitAttempt);

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

  describe('lifecycle', () => {
    it('should call tokeniseAndPatchWordingField in constructor', () => {
      fixture = TestBed.createComponent(WordingParserComponent);
      component = fixture.componentInstance;

      const tokeniseAndPatchSpy = jest.spyOn(
        component as never,
        'tokeniseAndPatchWordingField' as never,
      );

      fixture.componentRef.setInput('wordingObject', makeWordingObject());
      tokeniseAndPatchSpy.mockClear();

      fixture.detectChanges();

      expect(tokeniseAndPatchSpy).toHaveBeenCalledTimes(1);
    });

    it('should retokenize and patch wording fields when the wording object changes', () => {
      init(
        makeWordingObject({
          template: 'Hello {{ name }}',
          'substitution-key-constraints': [
            {
              key: 'name',
              value: 'Initial value',
              constraint: {
                length: 20,
                type: TemplateConstraintTypeEnum.DATE,
              },
            },
          ],
        }),
      );

      const tokeniseAndPatchSpy = jest.spyOn(
        component as never,
        'tokeniseAndPatchWordingField' as never,
      );

      const updatedWording = makeWordingObject({
        template: 'Updated {{ date }}',
        'substitution-key-constraints': [
          {
            key: 'date',
            value: '16/03/2026',
            constraint: {
              length: 10,
              type: TemplateConstraintTypeEnum.DATE,
            },
          },
        ],
      });

      fixture.componentRef.setInput('wordingObject', updatedWording);
      fixture.componentRef.setInput('wordingObjectValues', updatedWording);
      fixture.detectChanges();

      expect(tokeniseAndPatchSpy).toHaveBeenCalled();
      expect(component.tokens).toEqual([
        { type: 'text', value: 'Updated ' },
        { type: 'input', key: 'date' },
      ]);
      expect(component.form.get('date')?.value).toBe('16/03/2026');
    });
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
      const wordingObject = makeWordingObject();

      init(wordingObject);
      fixture.componentRef.setInput('wordingObjectValues', wordingObject);
      fixture.detectChanges();

      expect(component.form.contains('Applicant-officer')).toBe(true);
      expect(component.form.contains('date')).toBe(true);

      expect(component.form.get('Applicant-officer')?.value).toBe('12345678');
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

      expect(component.form.get('Applicant-officer')?.value).toEqual('');
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
        { text: 'Enter a A in the wording section', href: '#A' },
        { text: 'Enter a B in the wording section', href: '#B' },
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
          text: 'A in the wording section must be 3 characters or fewer',
          href: '#A',
        },
      ]);
    });

    it('should emit maxlength error when value exceeds constraint and key is No. of accounts', () => {
      init(
        makeWordingObject({
          template: 'Hi {{No. of accounts}}',
          'substitution-key-constraints': [
            {
              key: 'No. of accounts',
              value: '',
              constraint: { length: 3, type: TemplateConstraintTypeEnum.TEXT },
            },
          ],
        }),
      );

      const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');

      (
        component.form.get('No-of-accounts') as unknown as FormControl<
          string | null
        >
      ).setValue('TOOLONG');

      component.submitWordingFields();

      expect(errorsSpy).toHaveBeenCalledWith([
        {
          text: 'No. of accounts in the wording section must be 3 characters or fewer',
          href: '#No-of-accounts',
        },
      ]);
    });

    it('should emit DTO and empty errors when valid', () => {
      init(makeWordingObject());

      fixture.componentRef.setInput('wordingObjectValues', makeWordingObject());
      fixture.detectChanges();

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
      expect(component.form.pristine).toBe(true);
    });
  });

  describe('validateForSubmit()', () => {
    it('returns errors and emits wordingFieldErrors when invalid', () => {
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
      const dtoSpy = jest.spyOn(component.wordingFieldsDTO, 'emit');

      const errors = component.validateForSubmit();

      expect(errors).toEqual([
        { text: 'Enter a A in the wording section', href: '#A' },
      ]);
      expect(errorsSpy).toHaveBeenCalledWith(errors);
      expect(dtoSpy).not.toHaveBeenCalled();
    });

    it('returns save-first error when form has unsaved changes', () => {
      init(makeWordingObject());

      fixture.componentRef.setInput(
        'wordingObjectValues',
        makeWordingObject({
          'substitution-key-constraints': [
            {
              key: 'Applicant officer',
              value: '12345678',
              constraint: { length: 12, type: TemplateConstraintTypeEnum.TEXT },
            },
            {
              key: 'date',
              value: '31/12/2026',
              constraint: { length: 10, type: TemplateConstraintTypeEnum.TEXT },
            },
          ],
        }),
      );
      fixture.detectChanges();

      const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');
      (
        component.form.get('Applicant-officer') as unknown as FormControl<
          string | null
        >
      ).setValue('changed');
      component.form.get('Applicant-officer')?.markAsDirty();
      component.form.markAsDirty();

      const errors = component.validateForSubmit();

      expect(errors).toEqual([
        {
          text: 'Save wording changes in the wording section before submitting',
          href: '#save-wording-button',
        },
      ]);
      expect(errorsSpy).toHaveBeenCalledWith(errors);
    });

    it('returns required errors instead of save-first when form is dirty and invalid', () => {
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

      (
        component.form.get('A') as unknown as FormControl<string | null>
      ).setValue('');

      const errors = component.validateForSubmit();

      expect(errors).toEqual([
        { text: 'Enter a A in the wording section', href: '#A' },
      ]);
      expect(errorsSpy).toHaveBeenCalledWith(errors);
    });
  });

  describe('wordingSubmitAttempt signal effect', () => {
    it('should emit errors when wordingSubmitAttempt increments and form invalid', () => {
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

      fixture.componentRef.setInput('wordingSubmitAttempt', 1);
      fixture.detectChanges();

      expect(errorsSpy).toHaveBeenCalledWith([
        { text: 'Enter a A in the wording section', href: '#A' },
      ]);
    });

    it('should emit empty array when wordingSubmitAttempt increments and form valid', () => {
      const wordingObject = makeWordingObject({
        template: 'Hi {{A}}',
        'substitution-key-constraints': [
          {
            key: 'A',
            constraint: { length: 5, type: TemplateConstraintTypeEnum.TEXT },
          },
        ],
      });

      const wordingObjectValues = makeWordingObject({
        template: 'Hi {{A}}',
        'substitution-key-constraints': [
          {
            key: 'A',
            value: 'OK',
            constraint: { length: 5, type: TemplateConstraintTypeEnum.TEXT },
          },
        ],
      });

      init(wordingObject);
      fixture.componentRef.setInput('wordingObjectValues', wordingObjectValues);
      fixture.detectChanges();
      const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');

      fixture.componentRef.setInput('wordingSubmitAttempt', 1);
      fixture.detectChanges();

      expect(errorsSpy).toHaveBeenCalledWith([]);
    });

    it('should emit save-first error when wordingSubmitAttempt increments with unsaved changes', () => {
      init(makeWordingObject());

      fixture.componentRef.setInput('wordingObjectValues', makeWordingObject());
      fixture.detectChanges();

      const errorsSpy = jest.spyOn(component.wordingFieldErrors, 'emit');
      (
        component.form.get('Applicant-officer') as unknown as FormControl<
          string | null
        >
      ).setValue('changed');
      (
        component.form.get('Applicant-officer') as unknown as FormControl<
          string | null
        >
      ).markAsDirty();
      component.form.markAsDirty();

      fixture.componentRef.setInput('wordingSubmitAttempt', 1);
      fixture.detectChanges();

      expect(errorsSpy).toHaveBeenCalledWith([
        {
          text: 'Save wording changes in the wording section before submitting',
          href: '#save-wording-button',
        },
      ]);
    });

    it('should emit DTO when wordingSubmitAttempt increments and showSaveButton is false', () => {
      init(
        makeWordingObject({
          template: 'Hi {{A}}',
          'substitution-key-constraints': [
            {
              key: 'A',
              constraint: { length: 5, type: TemplateConstraintTypeEnum.TEXT },
            },
          ],
        }),
      );

      fixture.componentRef.setInput(
        'wordingObjectValues',
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

      fixture.componentRef.setInput('showSaveButton', false);
      fixture.detectChanges();

      const dtoSpy = jest.spyOn(component.wordingFieldsDTO, 'emit');

      fixture.componentRef.setInput('wordingSubmitAttempt', 1);
      fixture.detectChanges();

      expect(dtoSpy).toHaveBeenCalledWith({
        wordingFields: [{ key: 'A', value: 'OK' }],
      });
    });
  });

  describe('tokeniseAndPatchWordingField()', () => {
    it('should emit wordingFieldsDTO on form value changes when showSaveButton is false', () => {
      fixture = TestBed.createComponent(WordingParserComponent);
      component = fixture.componentInstance;

      fixture.componentRef.setInput(
        'wordingObject',
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
      fixture.componentRef.setInput('showSaveButton', false);
      fixture.detectChanges();

      const dtoSpy = jest.spyOn(component.wordingFieldsDTO, 'emit');

      (
        component.form.get('A') as unknown as FormControl<string | null>
      ).setValue('NEW');

      expect(dtoSpy).toHaveBeenCalledWith({
        wordingFields: [{ key: 'A', value: 'NEW' }],
      });
    });
  });

  describe('normaliseKey', () => {
    it('should replace spaces and full stops with hyphens', () => {
      expect(component.normaliseKey('No. of accounts')).toBe('No-of-accounts');
    });
    it("transform 'Applicant officer' into 'Applicant-officer'", () => {
      expect(component.normaliseKey('Applicant officer')).toBe(
        'Applicant-officer',
      );
    });
  });
});
