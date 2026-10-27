import { TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';

import { MultipleRespondentsComponent } from '@components/multiple-respondents/multiple-respondents.component';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import { MultipleRespondentsState } from '@services/multiple-respondents.state';

describe('MultipleRespondentsComponent', () => {
  it.each([0, 1, 2])(
    'cancels adding the unsaved respondent at position %i and preserves the other fields',
    async (index) => {
      await TestBed.configureTestingModule({
        imports: [MultipleRespondentsComponent],
        providers: [MultipleRespondentsState],
      }).compileComponents();
      const state = TestBed.inject(MultipleRespondentsState);
      const forms = TestBed.inject(
        ApplicationListEntryFormService,
      ).createForms();
      state.sync(
        { key: 'No. of accounts', value: '3' },
        forms.respondentOrganisationForm,
        forms.form,
      );
      for (let i = 1; i < 3; i++) {
        state.add();
      }
      const fixture = TestBed.createComponent(MultipleRespondentsComponent);
      fixture.componentRef.setInput('state', state);
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;
      const sections = Array.from(element.querySelectorAll('section'));
      const rows = [...state.rows()];
      rows.forEach((row, i) => {
        row.form.patchValue({
          name: `Example organisation ${i}`,
          addressLine1: `Example address ${i}`,
        });
      });
      fixture.detectChanges();
      const cancel = sections[index].querySelector<HTMLButtonElement>(
        'button.govuk-button--secondary',
      )!;
      expect(cancel.textContent).toContain('Cancel adding respondent');
      cancel.click();
      fixture.detectChanges();
      expect(
        element.querySelector('[aria-label="Confirm respondent removal"]'),
      ).toBeNull();
      expect(element.contains(sections[index])).toBe(false);
      expect(element.querySelectorAll('section')).toHaveLength(2);
      expect(state.count()).toBe('2');
      const retained = rows.filter((_, i) => i !== index);
      expect(
        Array.from(
          element.querySelectorAll<HTMLInputElement>('input[id$="org-name"]'),
        ).map((input) => input.value),
      ).toEqual(retained.map((row) => row.form.controls.name.value));
      retained.forEach((row) => {
        expect(
          state.rows().some((retainedRow) => retainedRow.id === row.id),
        ).toBe(true);
      });
      const firstName = element.querySelector<HTMLInputElement>(
        '#respondent-org-name',
      )!;
      firstName.value = 'Example updated organisation';
      firstName.dispatchEvent(new Event('input'));
      expect(forms.respondentOrganisationForm.controls.name.value).toBe(
        'Example updated organisation',
      );
      expect(state.rows()[0].form.controls.name.value).toBe(
        'Example updated organisation',
      );
      fixture.componentRef.setInput('errors', [
        { href: '#respondent-org-name', text: 'Check the respondent name' },
      ]);
      fixture.detectChanges();
      expect(element.querySelector('#respondent-org-name')).toBeTruthy();
    },
  );

  it('clears validation errors when cancelling an unsaved respondent and keeps the sole respondent editable', async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleRespondentsComponent],
      providers: [MultipleRespondentsState],
    }).compileComponents();
    const state = TestBed.inject(MultipleRespondentsState);
    const forms = TestBed.inject(ApplicationListEntryFormService).createForms();
    state.sync(
      { key: 'No. of accounts', value: '1' },
      forms.respondentOrganisationForm,
      forms.form,
    );
    const fixture = TestBed.createComponent(MultipleRespondentsComponent);
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).not.toContain('Cancel adding respondent');
    fixture.componentInstance.add();
    fixture.componentInstance.complete(1);
    fixture.detectChanges();
    expect(
      element.querySelector('#respondent-panel-1 .govuk-error-summary'),
    ).toBeTruthy();
    element
      .querySelector<HTMLButtonElement>(
        '#respondent-panel-1 button.govuk-button--secondary',
      )!
      .click();
    fixture.detectChanges();
    expect(fixture.componentInstance.attempted()).not.toContain(1);
    expect(fixture.componentInstance.activeId()).toBe(0);
    expect(element.querySelector('#respondent-panel-1')).toBeNull();
    expect(element.querySelector('#respondent-org-name')).toBeTruthy();
    expect(element.textContent).not.toContain('Cancel adding respondent');
    expect(
      (await axe(element, { rules: { region: { enabled: false } } }))
        .violations,
    ).toEqual([]);
  });

  it('shows one panel at a time and preserves unsaved fields when navigating tabs by keyboard', async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleRespondentsComponent],
      providers: [MultipleRespondentsState],
    }).compileComponents();
    const state = TestBed.inject(MultipleRespondentsState);
    const forms = TestBed.inject(ApplicationListEntryFormService).createForms();
    state.sync(
      { key: 'No. of accounts', value: '3' },
      forms.respondentOrganisationForm,
      forms.form,
    );
    for (let i = 1; i < 3; i++) {
      state.add();
    }
    const fixture = TestBed.createComponent(MultipleRespondentsComponent);
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const tabs = Array.from(
      element.querySelectorAll<HTMLElement>('[role="tab"]'),
    );
    const panels = Array.from(
      element.querySelectorAll<HTMLElement>('[role="tabpanel"]'),
    );
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      'Organisation 1',
      'Organisation 2',
      'Organisation 3',
    ]);
    state.rows()[0].form.controls.name.setValue('Example unsaved organisation');
    const expectSelected = (index: number) => {
      fixture.detectChanges();
      expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(
        tabs.map((_, i) => String(i === index)),
      );
      expect(tabs.map((tab) => tab.tabIndex)).toEqual(
        tabs.map((_, i) => (i === index ? 0 : -1)),
      );
      expect(panels.map((panel) => panel.hidden)).toEqual(
        panels.map((_, i) => i !== index),
      );
      expect(tabs[index].getAttribute('aria-controls')).toBe(panels[index].id);
      expect(panels[index].getAttribute('aria-labelledby')).toBe(
        tabs[index].id,
      );
    };
    expectSelected(0);
    tabs[1].click();
    expectSelected(1);
    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    expectSelected(2);
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expectSelected(0);
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expectSelected(2);
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expectSelected(0);
    expect(
      element.querySelector<HTMLInputElement>('#respondent-org-name')?.value,
    ).toBe('Example unsaved organisation');
    expect(
      (await axe(element, { rules: { region: { enabled: false } } }))
        .violations,
    ).toEqual([]);
  });

  it('selects added organisations, reveals validation errors and keeps a valid selection after removal', async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleRespondentsComponent],
      providers: [MultipleRespondentsState],
    }).compileComponents();
    const state = TestBed.inject(MultipleRespondentsState);
    const forms = TestBed.inject(ApplicationListEntryFormService).createForms();
    state.sync(
      { key: 'No. of accounts', value: '1' },
      forms.respondentOrganisationForm,
      forms.form,
    );
    const fixture = TestBed.createComponent(MultipleRespondentsComponent);
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element: HTMLElement = fixture.nativeElement;
    component.add();
    fixture.detectChanges();
    expect(component.activeId()).toBe(1);
    component.complete(0);
    fixture.detectChanges();
    expect(component.activeId()).toBe(0);
    expect(
      element.querySelector('#respondent-panel-0')?.hasAttribute('hidden'),
    ).toBe(false);
    expect(
      element.querySelector('#respondent-panel-0 .govuk-error-summary'),
    ).toBeTruthy();
    component.select(1);
    fixture.componentRef.setInput('errors', [
      { href: '#respondent-org-name', text: 'Check the respondent name' },
    ]);
    fixture.detectChanges();
    expect(component.activeId()).toBe(0);
    component.remove(0);
    component.confirmRemoval();
    fixture.detectChanges();
    expect(component.activeId()).toBe(1);
    expect(element.querySelectorAll('[role="tab"]')).toHaveLength(1);
    expect(
      element.querySelector('[role="tabpanel"]')?.hasAttribute('hidden'),
    ).toBe(false);
    component.add();
    component.cancelRemoval();
    fixture.detectChanges();
    expect(component.activeId()).toBe(1);
  });

  it('collapses valid respondents to cards with Change and Remove header links, and supports cancelling an edit', async () => {
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
    for (let i = 1; i < 2; i++) {
      state.add();
    }
    const fixture = TestBed.createComponent(MultipleRespondentsComponent);
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const component = fixture.componentInstance;
    component.complete(0);
    fixture.detectChanges();
    expect(element.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(state.rows()[0].editing).toBe(true);
    state.rows()[0].form.patchValue({
      name: 'Example Bank',
      addressLine1: 'Example address A',
    });
    state.rows()[1].form.patchValue({
      name: 'Example Network',
      addressLine1: 'Example address B',
    });
    component.complete(0);
    component.complete(1);
    fixture.detectChanges();
    expect(element.querySelectorAll('.govuk-summary-card')).toHaveLength(2);
    expect(
      Array.from(element.querySelectorAll('[role="tab"]')).map((tab) =>
        tab.textContent?.trim(),
      ),
    ).toEqual(['Example Bank', 'Example Network']);
    expect(element.querySelectorAll('input')).toHaveLength(0);
    expect(
      element.querySelectorAll('.govuk-summary-card__title-wrapper a'),
    ).toHaveLength(4);
    expect(
      element.querySelectorAll('.govuk-summary-card')[0].textContent,
    ).toContain('Example Bank');
    expect(
      element.querySelectorAll('.govuk-summary-card')[1].textContent,
    ).toContain('Example Network');
    expect(
      (await axe(element, { rules: { region: { enabled: false } } }))
        .violations,
    ).toEqual([]);
    element
      .querySelector<HTMLAnchorElement>('.govuk-summary-card__actions a')!
      .click();
    fixture.detectChanges();
    expect(element.querySelectorAll('app-organisation-section')).toHaveLength(
      1,
    );
    expect(element.querySelectorAll('.govuk-summary-card')).toHaveLength(1);
    expect(
      element.querySelector<HTMLInputElement>('#respondent-org-name')?.value,
    ).toBe('Example Bank');
    const editSection = element.querySelector('section')!;
    expect(editSection.textContent).toContain('Cancel changes');
    expect(editSection.textContent).not.toContain('Remove');
    expect(editSection.textContent).not.toContain('Cancel adding respondent');
    expect(
      editSection.querySelector('button.govuk-button--secondary'),
    ).toBeNull();
    state.rows()[0].form.controls.name.setValue('Example changed name');
    component.cancelEdit(0);
    fixture.detectChanges();
    expect(state.rows()[0].form.controls.name.value).toBe('Example Bank');
    component.edit(0);
    state.rows()[0].form.controls.name.setValue('Example changed name');
    component.complete(0);
    fixture.detectChanges();
    expect(
      element.querySelectorAll('.govuk-summary-card')[0].textContent,
    ).toContain('Example changed name');
    expect(state.saveBlocked()).toBe(true);
    element
      .querySelectorAll<HTMLAnchorElement>('.govuk-summary-card__actions a')[1]
      .click();
    fixture.detectChanges();
    expect(
      element.querySelector('[aria-label="Confirm respondent removal"]'),
    ).toBeTruthy();
    const confirmation = element.querySelector(
      '[aria-label="Confirm respondent removal"]',
    )!;
    expect(confirmation.textContent).toContain(
      'Their name, address and contact details will be removed.',
    );
    expect(
      confirmation
        .querySelector('button.govuk-button--warning')
        ?.textContent?.trim(),
    ).toBe('Remove respondent');
    expect(
      confirmation
        .querySelector('button.govuk-button--secondary')
        ?.textContent?.trim(),
    ).toBe('Keep respondent');
    component.confirmRemoval();
    fixture.detectChanges();
    expect(element.querySelectorAll('.govuk-summary-card')).toHaveLength(1);
    expect(element.textContent).toContain('Example Network');
    expect(
      element.querySelectorAll('.govuk-summary-card__actions a'),
    ).toHaveLength(1);
  });

  it('shows a pre-populated valid respondent as a summary card', async () => {
    await TestBed.configureTestingModule({
      imports: [MultipleRespondentsComponent],
      providers: [MultipleRespondentsState],
    }).compileComponents();
    const forms = TestBed.inject(ApplicationListEntryFormService).createForms();
    forms.respondentOrganisationForm.patchValue({
      name: 'Example Bank',
      addressLine1: 'Example address',
    });
    const state = TestBed.inject(MultipleRespondentsState);
    state.sync(
      { key: 'No. of accounts', value: '1' },
      forms.respondentOrganisationForm,
      forms.form,
    );
    const fixture = TestBed.createComponent(MultipleRespondentsComponent);
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.govuk-summary-card'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('app-organisation-section'),
    ).toBeNull();
    fixture.componentRef.setInput('errors', [
      { href: '#respondent-org-name', text: 'Check the respondent name' },
    ]);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('#respondent-org-name'),
    ).toBeTruthy();
  });

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
    for (let i = 1; i < 2; i++) {
      state.add();
    }
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
