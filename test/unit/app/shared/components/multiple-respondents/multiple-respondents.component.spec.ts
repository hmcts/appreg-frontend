import { TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';

import { MultipleRespondentsComponent } from '@components/multiple-respondents/multiple-respondents.component';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import { MultipleRespondentsState } from '@services/multiple-respondents.state';

describe('MultipleRespondentsComponent', () => {
  it('has distinct fields and no detected accessibility violations, including removal confirmation', async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleRespondentsComponent],
      providers: [MultipleRespondentsState],
    }).compileComponents();
    const state = TestBed.inject(MultipleRespondentsState);
    const forms = TestBed.inject(ApplicationListEntryFormService).createForms();
    state.sync(
      { key: 'No. of accounts', value: '2' },
      forms.respondentOrganisationForm,
      forms.form,
    );
    const fixture = TestBed.createComponent(MultipleRespondentsComponent);
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const ids = Array.from(element.querySelectorAll('[id]')).map(
      (node) => node.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const input of element.querySelectorAll('input')) {
      expect(element.querySelector(`label[for="${input.id}"]`)).toBeTruthy();
    }
    expect(
      (await axe(element, { rules: { region: { enabled: false } } }))
        .violations,
    ).toEqual([]);
    state.remove(1);
    fixture.detectChanges();
    expect(
      element.querySelector('[aria-label="Confirm respondent removal"]'),
    ).toBeTruthy();
    expect(
      (await axe(element, { rules: { region: { enabled: false } } }))
        .violations,
    ).toEqual([]);
  });
});
