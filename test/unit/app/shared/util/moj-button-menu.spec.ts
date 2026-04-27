import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MojButtonMenu, MojButtonMenuDirective } from '@util/moj-button-menu';

@Component({
  standalone: true,
  imports: [MojButtonMenuDirective],
  template: `
    <div id="host" appMojButtonMenu>
      <div id="menu-1" class="moj-button-menu" data-module="moj-button-menu">
        <button
          type="button"
          class="moj-button-menu__toggle-button"
          aria-expanded="false"
        >
          Toggle
        </button>
        <ul class="moj-button-menu__wrapper"></ul>
      </div>
    </div>
  `,
})
class HostComponent {}

describe('MojButtonMenuDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let directive: MojButtonMenuDirective;
  let initAll: jest.Mock<Promise<void>, [ParentNode?]>;

  const syncClasses = () => {
    (
      directive as unknown as {
        syncOpenMenuClasses: () => void;
      }
    ).syncOpenMenuClasses();
    fixture.detectChanges();
  };

  const getMenu = (): HTMLElement =>
    fixture.debugElement.query(By.css('#menu-1')).nativeElement as HTMLElement;

  const getToggle = (): HTMLElement =>
    fixture.debugElement.query(By.css('.moj-button-menu__toggle-button'))
      .nativeElement as HTMLElement;

  const getWrapper = (): HTMLElement =>
    fixture.debugElement.query(By.css('.moj-button-menu__wrapper'))
      .nativeElement as HTMLElement;

  const mockRects = ({
    hostTop,
    hostBottom,
    menuTop,
    menuBottom,
    wrapperHeight,
  }: {
    hostTop: number;
    hostBottom: number;
    menuTop: number;
    menuBottom: number;
    wrapperHeight: number;
  }) => {
    const host = fixture.debugElement.query(By.css('#host'))
      .nativeElement as HTMLElement;
    const menu = getMenu();
    const wrapper = getWrapper();

    jest.spyOn(host, 'getBoundingClientRect').mockReturnValue({
      top: hostTop,
      bottom: hostBottom,
    } as DOMRect);
    jest.spyOn(menu, 'getBoundingClientRect').mockReturnValue({
      top: menuTop,
      bottom: menuBottom,
    } as DOMRect);
    Object.defineProperty(wrapper, 'offsetHeight', {
      configurable: true,
      value: wrapperHeight,
    });
  };

  beforeEach(async () => {
    initAll = jest.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: MojButtonMenu,
          useValue: { initAll },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    directive = fixture.debugElement
      .query(By.directive(MojButtonMenuDirective))
      .injector.get(MojButtonMenuDirective);
  });

  it('initialises button menus under the host element', () => {
    expect(initAll).toHaveBeenCalledWith(
      fixture.debugElement.query(By.css('#host')).nativeElement,
    );
  });

  it('adds the open class when a menu toggle is expanded', () => {
    getToggle().setAttribute('aria-expanded', 'true');

    syncClasses();

    expect(getMenu().classList.contains('app-moj-button-menu--open')).toBe(
      true,
    );
  });

  it('removes open state classes when a menu is collapsed', () => {
    const menu = getMenu();
    getToggle().setAttribute('aria-expanded', 'true');
    mockRects({
      hostTop: 0,
      hostBottom: 300,
      menuTop: 250,
      menuBottom: 280,
      wrapperHeight: 120,
    });

    syncClasses();
    expect(menu.classList.contains('app-moj-button-menu--open')).toBe(true);
    expect(menu.classList.contains('app-moj-button-menu--open-up')).toBe(true);

    getToggle().setAttribute('aria-expanded', 'false');
    syncClasses();

    expect(menu.classList.contains('app-moj-button-menu--open')).toBe(false);
    expect(menu.classList.contains('app-moj-button-menu--open-up')).toBe(false);
  });

  it('marks an open menu to open upward when there is not enough space below', () => {
    getToggle().setAttribute('aria-expanded', 'true');
    mockRects({
      hostTop: 0,
      hostBottom: 300,
      menuTop: 250,
      menuBottom: 280,
      wrapperHeight: 120,
    });

    syncClasses();

    expect(getMenu().classList.contains('app-moj-button-menu--open-up')).toBe(
      true,
    );
  });

  it('keeps an open menu opening downward when there is enough space below', () => {
    getToggle().setAttribute('aria-expanded', 'true');
    mockRects({
      hostTop: 0,
      hostBottom: 400,
      menuTop: 120,
      menuBottom: 150,
      wrapperHeight: 120,
    });

    syncClasses();

    expect(getMenu().classList.contains('app-moj-button-menu--open')).toBe(
      true,
    );
    expect(getMenu().classList.contains('app-moj-button-menu--open-up')).toBe(
      false,
    );
  });
});
