import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import type { ErrorItem } from '@components/error-summary/error-summary.component';
import { RespondentBulkApplicationComponent } from '@components/respondent-bulk-application/respondent-bulk-application.component';
import { buildErrorTextByDomId, errorTextForDomId } from '@util/error-items';

jest.mock('@util/error-items', () => ({
  buildErrorTextByDomId: jest.fn(),
  errorTextForDomId: jest.fn(),
}));

describe('RespondentBulkApplicationComponent', () => {
  let component: RespondentBulkApplicationComponent;
  let fixture: ComponentFixture<RespondentBulkApplicationComponent>;

  const buildErrorTextByDomIdMock = jest.mocked(buildErrorTextByDomId);
  const errorTextForDomIdMock = jest.mocked(errorTextForDomId);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RespondentBulkApplicationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RespondentBulkApplicationComponent);
    component = fixture.componentInstance;

    const form = new FormGroup({
      numberOfRespondents: new FormControl<number | null>(null),
      bulkReference: new FormControl<string | null>(null),
    });

    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('submitted', false);
    fixture.componentRef.setInput('errors', []);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build errorByDomId from errors input', () => {
    const errors: ErrorItem[] = [
      { text: 'Error A', href: '#field-a' } as ErrorItem,
      { text: 'Error B', href: '#field-b' } as ErrorItem,
    ];

    const mapping = {
      'field-a': 'Error A',
      'field-b': 'Error B',
    } as unknown as Record<string, string>;

    buildErrorTextByDomIdMock.mockReturnValue(mapping);

    fixture.componentRef.setInput('errors', errors);
    fixture.detectChanges();

    expect(buildErrorTextByDomIdMock).toHaveBeenCalledWith(errors);
    expect(component.errorByDomId()).toBe(mapping);
  });

  it('should rebuild errorByDomId when errors input changes', () => {
    const mapping1 = { a: 'A' } as unknown as Record<string, string>;
    const mapping2 = { b: 'B' } as unknown as Record<string, string>;

    buildErrorTextByDomIdMock.mockReset();
    buildErrorTextByDomIdMock
      .mockReturnValueOnce(mapping1)
      .mockReturnValueOnce(mapping2);

    const errors1 = [{ text: 'A', href: '#a' } as ErrorItem];
    fixture.componentRef.setInput('errors', errors1);
    fixture.detectChanges();

    expect(component.errorByDomId()).toBe(mapping1);

    const errors2 = [{ text: 'B', href: '#b' } as ErrorItem];
    fixture.componentRef.setInput('errors', errors2);
    fixture.detectChanges();

    expect(component.errorByDomId()).toBe(mapping2);

    const lastCallArgs = buildErrorTextByDomIdMock.mock.calls.at(-1);
    expect(lastCallArgs).toEqual([errors2]);

    expect(buildErrorTextByDomIdMock.mock.calls.length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('errorFor should delegate to errorTextForDomId with computed mapping', () => {
    const mapping = { 'some-id': 'Some error' } as unknown as Record<
      string,
      string
    >;
    buildErrorTextByDomIdMock.mockReturnValue(mapping);
    errorTextForDomIdMock.mockReturnValue('Some error');

    fixture.componentRef.setInput('errors', [
      { text: 'Some error', href: '#some-id' } as ErrorItem,
    ]);
    fixture.detectChanges();

    const result = component.errorFor('some-id');

    expect(errorTextForDomIdMock).toHaveBeenCalledWith(mapping, 'some-id');
    expect(result).toBe('Some error');
  });

  it('errorFor should return null when util returns null', () => {
    buildErrorTextByDomIdMock.mockReturnValue({});
    errorTextForDomIdMock.mockReturnValue(null);

    fixture.componentRef.setInput('errors', []);
    fixture.detectChanges();

    expect(component.errorFor('missing')).toBeNull();
  });
});
