import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCloseComponent } from '@components/list-close/list-close.component';
import { HeaderService } from '@core/services/header.service';

describe('ListCloseComponent', () => {
  let fixture: ComponentFixture<ListCloseComponent>;
  let component: ListCloseComponent;

  let headerServiceStub: Pick<
    HeaderService,
    'hideNavigation' | 'showNavigation'
  >;

  beforeEach(async () => {
    headerServiceStub = {
      hideNavigation: jest.fn(),
      showNavigation: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ListCloseComponent],
      providers: [{ provide: HeaderService, useValue: headerServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListCloseComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit hides navigation', () => {
    fixture.detectChanges();
    expect(headerServiceStub.hideNavigation).toHaveBeenCalledTimes(1);
  });

  it('ngOnDestroy shows navigation', () => {
    fixture.detectChanges();
    (headerServiceStub.showNavigation as jest.Mock).mockClear();

    fixture.destroy();

    expect(headerServiceStub.showNavigation).toHaveBeenCalledTimes(1);
  });

  it('defaults to Continue/Cancel labels and warning button style', () => {
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button.govuk-button',
    ) as HTMLButtonElement;
    const cancelLink = fixture.nativeElement.querySelector(
      'a.govuk-link',
    ) as HTMLAnchorElement;

    expect(component.closeButtonTxt()).toBe('Continue');
    expect(component.cancelButtonTxt()).toBe('Cancel');
    expect(component.isRedCloseButton()).toBe(true);
    expect(button.textContent?.trim()).toBe('Continue');
    expect(button.classList.contains('govuk-button--warning')).toBe(true);
    expect(cancelLink.textContent?.trim()).toBe('Cancel');
  });

  it('renders custom title when provided', () => {
    fixture.componentRef.setInput('title', 'Close this application list?');
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('h1');

    expect(heading?.textContent?.trim()).toBe('Close this application list?');
  });

  it('onConfirm sets isClosing=true, emits confirm and disables button', () => {
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.confirm, 'emit');
    const button = fixture.nativeElement.querySelector(
      'button.govuk-button',
    ) as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    expect(component.isClosing()).toBe(true);
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(button.disabled).toBe(true);
  });

  it('onCancel sets isClosing=false and emits cancelled', () => {
    fixture.detectChanges();

    const emitSpy = jest.spyOn(component.cancelled, 'emit');
    component.isClosing.set(true);

    const cancelLink = fixture.nativeElement.querySelector(
      'a.govuk-link',
    ) as HTMLAnchorElement;

    cancelLink.click();

    expect(component.isClosing()).toBe(false);
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });
});
