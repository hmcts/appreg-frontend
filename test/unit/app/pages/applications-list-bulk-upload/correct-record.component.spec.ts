import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';

import { CorrectRecordComponent } from '@components/applications-list-detail/applications-list-bulk-upload/correct-record/correct-record.component';

describe('CorrectRecordComponent', () => {
  let fixture: ComponentFixture<CorrectRecordComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CorrectRecordComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CorrectRecordComponent);
    fixture.componentRef.setInput('rowNumber', 2);
    fixture.componentRef.setInput('fields', [
      {
        column: 0,
        header: 'APPLICATION_CODE',
        label: 'Application code',
        value: 'BAD',
        messages: ['Check the code'],
      },
      {
        column: 1,
        header: 'EXTRA',
        label: 'Extra',
        value: 'Unchanged',
        messages: [],
      },
    ]);
    fixture.detectChanges();
  });

  it('saves a draft without altering readonly fields or submitting an upload', () => {
    const saved = jest.fn();
    fixture.componentInstance.saveRecord.subscribe(saved);
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    textarea.value = 'FIXED';
    textarea.dispatchEvent(new Event('input'));
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { cancelable: true }));
    expect(saved).toHaveBeenCalledWith(new Map([[0, 'FIXED']]));
    expect(fixture.nativeElement.querySelectorAll('textarea')).toHaveLength(1);
    expect(fixture.componentInstance.fields()[0].value).toBe('BAD');
  });

  it('Cancel requests cancellation without saving the draft', () => {
    const saved = jest.fn();
    const cancelled = jest.fn();
    fixture.componentInstance.saveRecord.subscribe(saved);
    fixture.componentInstance.cancelEdit.subscribe(cancelled);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    buttons.find((button) => button.textContent?.trim() === 'Cancel')?.click();
    expect(cancelled).toHaveBeenCalled();
    expect(saved).not.toHaveBeenCalled();
  });

  it('links validation messages to labelled fields and has no detected accessibility violations', async () => {
    const link = fixture.nativeElement.querySelector('a[href="#csv-field-0"]');
    expect(link).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('label[for="csv-field-0"]'),
    ).not.toBeNull();
    const result = await axe(fixture.nativeElement);
    expect(result.violations).toEqual([]);
  });
});
