import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewConfirmComponent } from '@components/review-confirm/review-confirm.component';
import { HeaderService } from '@services/header.service';

describe('ReviewConfirmComponent', () => {
  let fixture: ComponentFixture<ReviewConfirmComponent>;
  let component: ReviewConfirmComponent;

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
      imports: [ReviewConfirmComponent],
      providers: [{ provide: HeaderService, useValue: headerServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewConfirmComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit hides navigation', () => {
    fixture.detectChanges(); // triggers ngOnInit
    expect(headerServiceStub.hideNavigation).toHaveBeenCalledTimes(1);
  });

  it('ngOnDestroy shows navigation', () => {
    fixture.detectChanges();
    (headerServiceStub.showNavigation as jest.Mock).mockClear();

    fixture.destroy(); // triggers ngOnDestroy
    expect(headerServiceStub.showNavigation).toHaveBeenCalledTimes(1);
  });

  it('defaults: isConfimed is false initially', () => {
    expect(component.isConfirmed()).toBe(false);
  });

  it('onConfirm sets isConfirmed=true and emits confirm', () => {
    const emitSpy = jest.spyOn(component.confirm, 'emit');

    component.onConfirm();

    expect(component.isConfirmed()).toBe(true);
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('onCancel sets isConfirmed=false and emits cancelled', () => {
    const emitSpy = jest.spyOn(component.cancelled, 'emit');

    component.isConfirmed.set(true); // simulate mid-delete
    component.onCancel();

    expect(component.isConfirmed()).toBe(false);
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('inputs: can set numberOfItems/title/button text/isRedButton', () => {
    fixture.componentRef.setInput('numberOfItems', 2);
    fixture.componentRef.setInput('title', 'Delete lists');
    fixture.componentRef.setInput('confirmButtonTxt', 'Delete');
    fixture.componentRef.setInput('cancelButtonTxt', 'Back');
    fixture.componentRef.setInput('isRedButton', false);

    fixture.detectChanges();

    expect(component.numberOfItems()).toBe(2);
    expect(component.title()).toBe('Delete lists');
    expect(component.confirmButtonTxt()).toBe('Delete');
    expect(component.cancelButtonTxt()).toBe('Back');
    expect(component.isRedButton()).toBe(false);
  });
});
