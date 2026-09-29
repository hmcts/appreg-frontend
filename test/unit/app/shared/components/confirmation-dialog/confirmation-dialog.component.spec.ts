import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationDialogComponent } from '@components/confirmation-dialog/confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let component: ConfirmationDialogComponent;
  let dialog: HTMLDialogElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    fixture.componentRef.setInput('heading', 'Leave the reports page?');
    fixture.componentRef.setInput(
      'message',
      'You will not receive your report.',
    );
    fixture.detectChanges();
    component = fixture.componentInstance;
    dialog = fixture.nativeElement.querySelector('dialog');
    // jsdom does not implement native dialog behaviour; browser checks cover focus and inertness.
    dialog.showModal = jest.fn(() => {
      dialog.open = true;
    });
    dialog.close = jest.fn(() => {
      dialog.open = false;
    });
  });

  it('renders an accessible name, description and safe initial focus', () => {
    expect(
      dialog.querySelector(`#${dialog.getAttribute('aria-labelledby')}`)
        ?.textContent,
    ).toContain('Leave the reports page?');
    expect(
      dialog.querySelector(`#${dialog.getAttribute('aria-describedby')}`)
        ?.textContent,
    ).toContain('You will not receive your report.');
    expect(dialog.querySelector('[autofocus]')?.textContent).toContain(
      'Stay on this page',
    );
  });

  it.each([false, true])('resolves the button decision once: %s', (leave) => {
    const next = jest.fn();
    const complete = jest.fn();
    const decision = component.confirm();
    expect(dialog.open).toBe(false);
    decision.subscribe({ next, complete });
    expect(dialog.open).toBe(true);
    dialog
      .querySelectorAll<HTMLButtonElement>('.govuk-button-group button')
      [leave ? 1 : 0].click();
    expect(next).toHaveBeenCalledWith(leave);
    expect(next).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(false);
    component.dismiss();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('treats the labelled header close button as staying', () => {
    const next = jest.fn();
    component.confirm().subscribe(next);
    dialog
      .querySelector<HTMLButtonElement>('button[aria-label="Close dialog"]')
      ?.click();
    expect(next).toHaveBeenCalledWith(false);
    expect(dialog.open).toBe(false);
  });

  it('treats Escape as staying', () => {
    const next = jest.fn();
    component.confirm().subscribe(next);
    const event = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(next).toHaveBeenCalledWith(false);
    expect(dialog.open).toBe(false);
  });

  it('closes without a decision when the router unsubscribes', () => {
    const next = jest.fn();
    const subscription = component.confirm().subscribe(next);
    subscription.unsubscribe();
    expect(dialog.open).toBe(false);
    component.dismiss();
    expect(next).not.toHaveBeenCalled();
  });

  it('replaces an outstanding confirmation and ignores its queued close event', () => {
    const first = jest.fn();
    const second = jest.fn();
    component.confirm().subscribe(first);
    component.confirm().subscribe(second);
    expect(first).toHaveBeenCalledWith(false);
    dialog.dispatchEvent(new Event('close'));
    expect(second).not.toHaveBeenCalled();
    component.answer(true);
    expect(second).toHaveBeenCalledWith(true);
  });

  it('settles an unexpected native close as staying', () => {
    const next = jest.fn();
    component.confirm().subscribe(next);
    dialog.open = false;
    dialog.dispatchEvent(new Event('close'));
    expect(next).toHaveBeenCalledWith(false);
  });

  it('settles pending navigation on destruction', () => {
    const next = jest.fn();
    component.confirm().subscribe(next);
    fixture.destroy();
    expect(next).toHaveBeenCalledWith(false);
    expect(dialog.open).toBe(false);
  });
});
