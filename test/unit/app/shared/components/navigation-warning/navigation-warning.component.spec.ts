import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';

import { ConfirmationDialogComponent } from '@components/confirmation-dialog/confirmation-dialog.component';
import { NavigationWarningComponent } from '@components/navigation-warning/navigation-warning.component';

describe('NavigationWarningComponent', () => {
  let fixture: ComponentFixture<NavigationWarningComponent>;
  let component: NavigationWarningComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationWarningComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationWarningComponent);
    fixture.componentRef.setInput('active', false);
    fixture.componentRef.setInput('heading', 'Leave this page?');
    fixture.componentRef.setInput('message', 'Your work will be lost.');
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('allows navigation without confirmation when inactive', () => {
    const dialog = fixture.debugElement.query(
      By.directive(ConfirmationDialogComponent),
    ).componentInstance as ConfirmationDialogComponent;
    const confirm = jest.spyOn(dialog, 'confirm');

    expect(component.canLeave()).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'returns the dialog decision when active: %s',
    (leave) => {
      fixture.componentRef.setInput('active', true);
      fixture.detectChanges();
      const dialog = fixture.debugElement.query(
        By.directive(ConfirmationDialogComponent),
      ).componentInstance as ConfirmationDialogComponent;
      jest.spyOn(dialog, 'confirm').mockReturnValue(of(leave));
      const decision = jest.fn();

      (component.canLeave() as Observable<boolean>).subscribe(decision);

      expect(decision).toHaveBeenCalledWith(leave);
    },
  );

  it('warns on unload only while active and removes the listener on destruction', () => {
    const unload = (): boolean =>
      window.dispatchEvent(new Event('beforeunload', { cancelable: true }));

    expect(unload()).toBe(true);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    expect(unload()).toBe(false);
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    expect(unload()).toBe(true);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    fixture.destroy();
    expect(unload()).toBe(true);
  });

  it('dismisses an open dialog when the warning becomes inactive', () => {
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    const dialog = fixture.debugElement.query(
      By.directive(ConfirmationDialogComponent),
    ).componentInstance as ConfirmationDialogComponent;
    const dismiss = jest.spyOn(dialog, 'dismiss');

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();

    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
