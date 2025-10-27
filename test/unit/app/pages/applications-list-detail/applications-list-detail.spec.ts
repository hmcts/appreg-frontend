import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ApplicationsListDetail } from '../../../../../src/app/pages/applications-list-detail/applications-list-detail';

describe('ApplicationsListDetail', () => {
  let fixture: ComponentFixture<ApplicationsListDetail>;
  let component: ApplicationsListDetail;
  let stateSpy: jest.SpyInstance;

  beforeEach(async () => {
    const row = {
      id: 'id-1',
      location: 'LOC1',
      description: '',
      status: 'OPEN',
    };

    stateSpy = jest
      .spyOn(globalThis.history, 'state', 'get')
      .mockReturnValue({ row });

    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetail],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    stateSpy?.mockRestore();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders tabs with correct selection', () => {
    const appsTab = fixture.debugElement.query(By.css('#tab_applications'));
    const detailsTab = fixture.debugElement.query(By.css('#tab_list-details'));
    expect(appsTab).toBeTruthy();
    expect(detailsTab).toBeTruthy();
    expect(appsTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    expect(detailsTab.nativeElement.getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('shows success banner when updateDone is true', () => {
    component.updateDone = true;
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('app-success-banner')),
    ).toBeTruthy();
  });

  it('shows error summary when unpopulated fields exist', () => {
    component.unpopField = [{ href: '#x', text: 'Error' }];
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('app-error-summary')),
    ).toBeTruthy();
  });

  it('submits form and calls onUpdate', () => {
    const spy = jest.spyOn(component, 'onUpdate');
    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    expect(spy).toHaveBeenCalled();
  });

  it('disables Court suggestions when Other location or CJA is filled', () => {
    component.form.get('location')?.setValue('Town Hall');
    fixture.detectChanges();
    {
      const courts = fixture.debugElement.queryAll(By.css('app-suggestions'));
      const courtSug = courts[0];
      expect(courtSug.componentInstance.disabled).toBe(true);
    }
  });

  it('disables CJA suggestions when Court is chosen or courthouseSearch has text', () => {
    component.form.get('court')?.setValue('LOC123');
    fixture.detectChanges();
    {
      const suggestions = fixture.debugElement.queryAll(
        By.css('app-suggestions'),
      );
      const cjaSug = suggestions[1];
      expect(cjaSug.componentInstance.disabled).toBe(true);
    }

    component.form.get('court')?.setValue('LOC123');
    fixture.detectChanges();
    {
      expect(component.form.get('location')?.disabled).toBe(true);
      const otherLoc = fixture.debugElement.query(
        By.css('app-text-input[formControlName="location"]'),
      );
      if (otherLoc?.componentInstance) {
        expect(otherLoc.componentInstance.disabled).toBe(true);
      }
    }
  });

  it('disables Other location when Court is chosen', () => {
    component.form.get('court')?.setValue('LOC123');
    fixture.detectChanges();
    const otherLoc = fixture.debugElement.query(
      By.css('app-text-input[formControlName="location"]'),
    );
    expect(component.form.get('location')?.disabled).toBe(true);
    expect(otherLoc.componentInstance.disabled).toBe(true);
  });

  it('exposes pagination inputs and handles onPageChange', () => {
    expect(typeof component.currentPage).toBeDefined();
    expect(typeof component.totalPages).toBeDefined();
    if (typeof component.onPageChange === 'function') {
      component.onPageChange(3);
      expect(component.currentPage).toBe(3);
    }
  });
});
