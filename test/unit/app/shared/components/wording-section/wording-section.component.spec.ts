import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { WordingSectionComponent } from '@components/wording-section/wording-section.component';
import { TemplateDetail, TemplateSubstitution } from '@openapi';

describe('WordingSectionComponent', () => {
  let component: WordingSectionComponent;
  let fixture: ComponentFixture<WordingSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordingSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WordingSectionComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('wordingObject', {} as TemplateDetail);
    fixture.componentRef.setInput('wordingSubmitAttempt', 0);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onWordingFieldsDTO emits the dto via wordingFieldsDTO output', () => {
    const spy = jest.spyOn(component.wordingFieldsDTO, 'emit');
    const dto = {
      wordingFields: [{ key: 'a', value: 'b' }] as TemplateSubstitution[],
    };
    component.onWordingFieldsDTO(dto);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(dto);
  });

  it('onWordingFieldErrors emits provided errors via wordingFieldErrors output', () => {
    const spy = jest.spyOn(component.wordingFieldErrors, 'emit');
    const errors: ErrorItem[] = [{ text: 'some error' }];
    component.onWordingFieldErrors(errors);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(errors);
  });

  it('validateForSubmit delegates to wording parser when available', () => {
    const expectedErrors: ErrorItem[] = [{ text: 'wording validation error' }];

    (
      component as unknown as {
        wordingParser: { validateForSubmit: () => ErrorItem[] };
      }
    ).wordingParser = {
      validateForSubmit: () => expectedErrors,
    };

    expect(component.validateForSubmit()).toEqual(expectedErrors);
  });

  it('onWordingFieldsDTO sets saveSuccessful() to true', () => {
    const dto = {
      wordingFields: [{ key: 'a', value: 'b' }] as TemplateSubstitution[],
    };

    component.onWordingFieldsDTO(dto);
    expect(component.saveSuccessful()).toEqual(true);
  });

  it('onWordingFieldErrors sets saveSuccessful() to false', () => {
    const errors: ErrorItem[] = [{ text: 'some error' }];
    component.onWordingFieldErrors(errors);
    expect(component.saveSuccessful()).toEqual(false);
  });
});
