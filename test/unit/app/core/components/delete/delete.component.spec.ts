import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteComponent } from '@components/delete/delete.component';
import { HeaderService } from '@services/header.service';

describe('DeleteComponent', () => {
  let fixture: ComponentFixture<DeleteComponent>;
  let component: DeleteComponent;

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
      imports: [DeleteComponent],
      providers: [{ provide: HeaderService, useValue: headerServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteComponent);
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

  it('defaults: isDeleting is false initially', () => {
    expect(component.isDeleting()).toBe(false);
  });

  it('onConfirm sets isDeleting=true and emits confirm', () => {
    const emitSpy = jest.spyOn(component.confirm, 'emit');

    component.onConfirm();

    expect(component.isDeleting()).toBe(true);
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('onCancel sets isDeleting=false and emits cancelled', () => {
    const emitSpy = jest.spyOn(component.cancelled, 'emit');

    component.isDeleting.set(true); // simulate mid-delete
    component.onCancel();

    expect(component.isDeleting()).toBe(false);
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('inputs: can set numberOfItems/title/button text/isRedDeleteButton', () => {
    fixture.componentRef.setInput('numberOfItems', 2);
    fixture.componentRef.setInput('title', 'Delete lists');
    fixture.componentRef.setInput('deleteButtonTxt', 'Delete');
    fixture.componentRef.setInput('cancelButtonTxt', 'Back');
    fixture.componentRef.setInput('isRedDeleteButton', false);

    fixture.detectChanges();

    expect(component.numberOfItems()).toBe(2);
    expect(component.title()).toBe('Delete lists');
    expect(component.deleteButtonTxt()).toBe('Delete');
    expect(component.cancelButtonTxt()).toBe('Back');
    expect(component.isRedDeleteButton()).toBe(false);
  });
});
