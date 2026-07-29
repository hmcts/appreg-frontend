import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { ApplicationsListFormComponent } from '@components/applications-list-form/applications-list-form.component';
import type { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { APPLICATIONS_LIST_FORM_ERROR_MESSAGES } from '@constants/applications-list/applications-list.constants';

describe('ApplicationsListFormComponent (Jest)', () => {
  let fixture: ComponentFixture<ApplicationsListFormComponent>;
  let component: ApplicationsListFormComponent;

  const makeRequiredInputs = () => {
    const form = new FormGroup({ court: new FormControl('') }) as unknown;

    const suggestions = {} as unknown as SuggestionsFacade;

    return { form, suggestions };
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListFormComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ApplicationsListFormComponent, {
        set: {
          template:
            '<button id="adv" (click)="onAdvancedClick($event)">Advanced</button>',
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ApplicationsListFormComponent);
    component = fixture.componentInstance;

    const { form, suggestions } = makeRequiredInputs();
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('suggestions', suggestions);
    fixture.componentRef.setInput(
      'errorMap',
      APPLICATIONS_LIST_FORM_ERROR_MESSAGES,
    );

    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  describe('mode computed flags', () => {
    it('defaults to search mode', () => {
      expect(component.isSearch()).toBe(true);
      expect(component.isCreate()).toBe(false);
      expect(component.isUpdate()).toBe(false);
    });

    it('create mode sets computed flags correctly', () => {
      fixture.componentRef.setInput('mode', 'create');
      fixture.detectChanges();

      expect(component.isCreate()).toBe(true);
      expect(component.isSearch()).toBe(false);
      expect(component.isUpdate()).toBe(false);
    });

    it('update mode sets computed flags correctly', () => {
      fixture.componentRef.setInput('mode', 'update');
      fixture.detectChanges();

      expect(component.isUpdate()).toBe(true);
      expect(component.isSearch()).toBe(false);
      expect(component.isCreate()).toBe(false);
    });
  });

  describe('showStatus / showDuration', () => {
    it('showStatus is true for search mode', () => {
      fixture.componentRef.setInput('mode', 'search');
      fixture.detectChanges();
      expect(component.showStatus()).toBe(true);
    });

    it('showStatus is false for create mode', () => {
      fixture.componentRef.setInput('mode', 'create');
      fixture.detectChanges();
      expect(component.showStatus()).toBe(false);
    });

    it('showStatus is false when the field is explicitly hidden', () => {
      fixture.componentRef.setInput('mode', 'search');
      fixture.componentRef.setInput('showStatusField', false);
      fixture.detectChanges();

      expect(component.showStatus()).toBe(false);
    });

    it('showDuration is true only for update mode', () => {
      fixture.componentRef.setInput('mode', 'search');
      fixture.detectChanges();
      expect(component.showDuration()).toBe(false);

      fixture.componentRef.setInput('mode', 'create');
      fixture.detectChanges();
      expect(component.showDuration()).toBe(false);

      fixture.componentRef.setInput('mode', 'update');
      fixture.detectChanges();
      expect(component.showDuration()).toBe(true);
    });
  });

  describe('showError / errorText', () => {
    it('showError and errorText are empty when not submitted', () => {
      fixture.componentRef.setInput('submitted', false);
      component.form().controls.court.setErrors({ courtNotFound: true });
      fixture.detectChanges();

      expect(component.showError('court')).toBe(false);
      expect(component.errorText('court')).toBe('');
    });

    it('showError and errorText return the mapped control error when submitted', () => {
      fixture.componentRef.setInput('submitted', true);
      component.form().controls.court.setErrors({ courtNotFound: true });
      fixture.detectChanges();

      expect(component.showError('court')).toBe(true);
      expect(component.errorText('court')).toBe('Court location not found');
    });

    it('errorText returns empty string when the control has no mapped error', () => {
      component.form().controls.court.setErrors(null);
      fixture.detectChanges();

      expect(component.errorText('court')).toBe('');
      expect(component.showError('court')).toBe(false);
    });

    it('uses an external error for a field when the control has no mapped error', () => {
      fixture.componentRef.setInput('submitted', true);
      fixture.componentRef.setInput('externalErrors', [
        {
          id: 'court',
          href: '#court',
          text: 'Court location no longer exists',
        },
      ]);
      fixture.detectChanges();

      expect(component.showError('court')).toBe(true);
      expect(component.errorText('court')).toBe(
        'Court location no longer exists',
      );
    });

    it('prefers a mapped control error over an external error for the same field', () => {
      fixture.componentRef.setInput('submitted', true);
      fixture.componentRef.setInput('externalErrors', [
        {
          id: 'court',
          href: '#court',
          text: 'Court location no longer exists',
        },
      ]);
      component.form().controls.court.setErrors({ courtNotFound: true });
      fixture.detectChanges();

      expect(component.errorText('court')).toBe('Court location not found');
    });
  });

  describe('onAdvancedClick', () => {
    it('prevents default and calls onToggleAdvanced callback', () => {
      const cb = jest.fn<void, []>();

      fixture.componentRef.setInput('onToggleAdvanced', cb);
      fixture.detectChanges();

      const evt = { preventDefault: jest.fn() } as unknown as Event;

      component.onAdvancedClick(evt);

      expect(
        (evt as unknown as { preventDefault: jest.Mock }).preventDefault,
      ).toHaveBeenCalled();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('clicking the template button triggers onAdvancedClick and calls callback', () => {
      const cb = jest.fn<void, []>();

      fixture.componentRef.setInput('onToggleAdvanced', cb);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector(
        '#adv',
      ) as HTMLButtonElement;
      btn.click();

      expect(cb).toHaveBeenCalledTimes(1);
    });
  });
});
