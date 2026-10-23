import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe } from 'jest-axe';

import { OrganisationsPrototypeComponent } from '../../../../../src/app/pages/organisations-prototype/organisations-prototype.component';

describe('Count-driven respondent prototype', () => {
  let fixture: ComponentFixture<OrganisationsPrototypeComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganisationsPrototypeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(OrganisationsPrototypeComponent);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  function button(text: string): HTMLButtonElement {
    const found = Array.from(element.querySelectorAll('button')).find((item) =>
      item.textContent?.trim().startsWith(text),
    );
    if (!found) {
      throw new Error(`Button not found: ${text}`);
    }
    return found;
  }

  function click(text: string): void {
    button(text).click();
    fixture.detectChanges();
  }

  function enter(id: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(`#${id}`);
    if (!input) {
      throw new Error(`Input not found: ${id}`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function review(): void {
    element
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  }

  it('starts with wording and one complete, independently labelled organisation form', () => {
    expect(element.querySelectorAll('app-organisation-section')).toHaveLength(
      1,
    );
    expect(
      element.querySelectorAll('app-organisation-section input'),
    ).toHaveLength(10);
    expect(element.textContent).not.toContain('Remove respondent');
    element.querySelectorAll('input').forEach((input) => {
      expect(element.querySelector(`label[for="${input.id}"]`)).toBeTruthy();
    });
    fixture.componentInstance.remove(1);
    expect(fixture.componentInstance.organisations()).toHaveLength(1);
  });

  it('creates two respondents from wording while preserving the first complete form', () => {
    enter('respondent-1-org-name', 'Example Organisation A');
    enter('respondent-1-org-address-line-1', 'Example address A');
    enter('account-count', '2');
    click('Update respondents');
    enter('respondent-2-org-name', 'Example Organisation B');
    enter('respondent-2-org-address-line-1', 'Example address B');
    expect(element.querySelectorAll('app-organisation-section')).toHaveLength(
      2,
    );
    expect(
      fixture.componentInstance
        .organisations()
        .map((row) => row.form.getRawValue().addressLine1),
    ).toEqual(['Example address A', 'Example address B']);
    const ids = Array.from(element.querySelectorAll('input')).map(
      (input) => input.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      '2 respondent sections',
    );
  });

  it.each(['', '0', '-1', '1.5', 'two', '21', '1e1', '9007199254740992'])(
    'rejects invalid account count %p without changing existing details',
    (value) => {
      enter('respondent-1-org-name', 'Example Organisation A');
      enter('account-count', value);
      click('Update respondents');
      expect(
        element.querySelector('#account-count-error')?.textContent,
      ).toContain('Enter a whole number');
      expect(fixture.componentInstance.organisations()).toHaveLength(1);
      expect(
        fixture.componentInstance.organisations()[0].form.controls.name.value,
      ).toBe('Example Organisation A');
      review();
      expect(fixture.componentInstance.stage()).toBe('edit');
    },
  );

  it('requires applying the wording count before review', () => {
    enter('respondent-1-org-name', 'Example Organisation A');
    enter('account-count', '2');
    review();
    expect(
      element.querySelector('#account-count-error')?.textContent,
    ).toContain('Update respondents');
    expect(fixture.componentInstance.stage()).toBe('edit');
  });

  it('previews count reductions, cancels without losing data, then removes only the trailing respondents', () => {
    enter('account-count', '3');
    click('Update respondents');
    enter('respondent-1-org-name', 'Example Organisation A');
    enter('respondent-2-org-name', 'Example Organisation B');
    enter('respondent-3-org-name', 'Example Organisation C');
    enter('respondent-3-org-address-line-1', 'Example address C');
    enter('account-count', '1');
    click('Update respondents');
    expect(element.querySelector('ul')?.textContent).toContain(
      'Example Organisation B',
    );
    expect(element.querySelector('ul')?.textContent).toContain(
      'Example Organisation C',
    );
    expect(fixture.componentInstance.organisations()).toHaveLength(3);
    click('Keep respondents');
    expect(fixture.componentInstance.accountCount.value).toBe('3');
    expect(
      fixture.componentInstance.organisations()[2].form.controls.addressLine1
        .value,
    ).toBe('Example address C');
    enter('account-count', '1');
    click('Update respondents');
    click('Remove respondents');
    expect(fixture.componentInstance.organisations()).toHaveLength(1);
    expect(
      fixture.componentInstance.organisations()[0].form.controls.name.value,
    ).toBe('Example Organisation A');
    expect(fixture.componentInstance.accountCount.value).toBe('1');
  });

  it('adds and removes a chosen respondent while keeping the wording count in sync', () => {
    enter('respondent-1-org-name', 'Example Organisation A');
    click('Add another respondent');
    enter('respondent-2-org-name', 'Example Organisation B');
    click('Add another respondent');
    enter('respondent-3-org-name', 'Example Organisation C');
    element.querySelectorAll<HTMLButtonElement>('section button')[1].click();
    fixture.detectChanges();
    click('Remove respondents');
    expect(
      fixture.componentInstance
        .organisations()
        .map((row) => row.form.controls.name.value),
    ).toEqual(['Example Organisation A', 'Example Organisation C']);
    expect(fixture.componentInstance.accountCount.value).toBe('2');
  });

  it('rejects whitespace names, links each error and permits optional address and contact details', () => {
    enter('respondent-1-org-name', '   ');
    click('Add another respondent');
    review();
    const links = element.querySelectorAll<HTMLAnchorElement>(
      '.govuk-error-summary a',
    );
    expect(links).toHaveLength(2);
    links.forEach((link) => {
      expect(element.querySelector(link.hash)).toBeTruthy();
      expect(element.querySelector(`${link.hash}-error`)).toBeTruthy();
    });
    enter('respondent-1-org-name', 'Example Organisation A');
    enter('respondent-2-org-name', 'Example Organisation B');
    review();
    expect(fixture.componentInstance.stage()).toBe('review');
  });

  it('reviews complete separate details and preserves them through a change journey', () => {
    enter('applicant-name', 'Example Applicant');
    enter('respondent-1-org-name', '  Example Organisation A  ');
    enter('respondent-1-org-address-line-1', 'Example address A');
    review();
    expect(element.querySelector('dl')?.textContent).toContain(
      'Example address A',
    );
    expect(element.textContent).toContain('Example Applicant');
    element.querySelector<HTMLAnchorElement>('dl a')?.click();
    fixture.detectChanges();
    expect(
      element.querySelector<HTMLInputElement>(
        '#respondent-1-org-address-line-1',
      )?.value,
    ).toBe('Example address A');
    enter('respondent-1-org-name', 'Example Organisation C');
    review();
    expect(element.querySelector('dl')?.textContent).toContain(
      'Example Organisation C',
    );
    click('Finish prototype');
    click('Return to respondents');
    expect(
      element.querySelector<HTMLInputElement>('#respondent-1-org-name')?.value,
    ).toBe('Example Organisation C');
    review();
    click('Finish prototype');
    click('Start again');
    expect(
      element.querySelector<HTMLInputElement>('#applicant-name')?.value,
    ).toBe('');
    expect(fixture.componentInstance.accountCount.value).toBe('1');
    expect(fixture.componentInstance.organisations()).toHaveLength(1);
    expect(
      fixture.componentInstance.organisations()[0].form.controls.name.value,
    ).toBe('');
  });

  it.each([false, true])(
    'has no detected accessibility violations throughout the journey (embedded: %s)',
    async (embedded) => {
      fixture.componentRef.setInput('embedded', embedded);
      fixture.detectChanges();
      for (const state of ['edit', 'error', 'removal', 'review', 'complete']) {
        if (state === 'error') {
          review();
        } else if (state === 'removal') {
          click('Add another respondent');
          click('Remove');
        } else if (state === 'review') {
          click('Remove respondents');
          enter('respondent-2-org-name', 'Example Organisation A');
          review();
        } else if (state === 'complete') {
          click('Finish prototype');
        }
        const results = await axe(element, {
          rules: { region: { enabled: false } },
        });
        expect(results.violations).toEqual([]);
      }
    },
  );
});
