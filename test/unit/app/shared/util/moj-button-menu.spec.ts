import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MojButtonMenu, MojButtonMenuDirective } from '@util/moj-button-menu';

@Component({
  standalone: true,
  imports: [MojButtonMenuDirective],
  template: `
    <div id="host" appMojButtonMenu>
      <table>
        <tbody>
          <tr id="row-1">
            <td id="cell-1">
              <div
                id="menu-1"
                class="moj-button-menu"
                data-module="moj-button-menu"
              >
                <button
                  type="button"
                  class="moj-button-menu__toggle-button"
                  aria-expanded="false"
                >
                  Toggle
                </button>
                <ul class="moj-button-menu__wrapper"></ul>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
    toggleTop,
    toggleBottom,
    toggleLeft,
    toggleRight,
    wrapperHeight,
    wrapperWidth,
    viewportHeight,
    viewportWidth,
  }: {
    toggleTop: number;
    toggleBottom: number;
    toggleLeft: number;
    toggleRight: number;
    wrapperHeight: number;
    wrapperWidth: number;
    viewportHeight: number;
    viewportWidth: number;
  }) => {
    const toggle = getToggle();
    const wrapper = getWrapper();

    jest.spyOn(toggle, 'getBoundingClientRect').mockReturnValue({
      top: toggleTop,
      bottom: toggleBottom,
      left: toggleLeft,
      right: toggleRight,
      width: toggleRight - toggleLeft,
    } as DOMRect);
    Object.defineProperty(wrapper, 'offsetHeight', {
      configurable: true,
      value: wrapperHeight,
    });
    Object.defineProperty(wrapper, 'offsetWidth', {
      configurable: true,
      value: wrapperWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: viewportHeight,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: viewportWidth,
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
    mockRects({
      toggleTop: 100,
      toggleBottom: 140,
      toggleLeft: 300,
      toggleRight: 420,
      wrapperHeight: 120,
      wrapperWidth: 200,
      viewportHeight: 900,
      viewportWidth: 1200,
    });

    syncClasses();

    expect(getMenu().classList.contains('app-moj-button-menu--open')).toBe(
      true,
    );
    expect(getWrapper().style.position).toBe('fixed');
  });

  it('removes open state classes when a menu is collapsed', () => {
    const menu = getMenu();
    getToggle().setAttribute('aria-expanded', 'true');
    mockRects({
      toggleTop: 100,
      toggleBottom: 140,
      toggleLeft: 300,
      toggleRight: 420,
      wrapperHeight: 120,
      wrapperWidth: 200,
      viewportHeight: 900,
      viewportWidth: 1200,
    });

    syncClasses();
    expect(menu.classList.contains('app-moj-button-menu--open')).toBe(true);
    expect(getWrapper().style.position).toBe('fixed');

    getToggle().setAttribute('aria-expanded', 'false');
    syncClasses();

    expect(menu.classList.contains('app-moj-button-menu--open')).toBe(false);
    expect(getWrapper().style.position).toBe('');
  });

  it('positions the open menu below the toggle when there is space', () => {
    getToggle().setAttribute('aria-expanded', 'true');
    mockRects({
      toggleTop: 100,
      toggleBottom: 140,
      toggleLeft: 300,
      toggleRight: 420,
      wrapperHeight: 120,
      wrapperWidth: 200,
      viewportHeight: 900,
      viewportWidth: 1200,
    });

    syncClasses();

    expect(getWrapper().style.top).toBe('148px');
    expect(getWrapper().style.left).toBe('300px');
  });

  it('positions the open menu above the toggle when there is not enough space below but enough above', () => {
    getToggle().setAttribute('aria-expanded', 'true');
    mockRects({
      toggleTop: 260,
      toggleBottom: 300,
      toggleLeft: 300,
      toggleRight: 420,
      wrapperHeight: 120,
      wrapperWidth: 200,
      viewportHeight: 360,
      viewportWidth: 1200,
    });

    syncClasses();

    expect(getWrapper().style.top).toBe('132px');
  });

  it('constrains the open menu height when it does not fit above or below', () => {
    getToggle().setAttribute('aria-expanded', 'true');
    mockRects({
      toggleTop: 40,
      toggleBottom: 80,
      toggleLeft: 300,
      toggleRight: 420,
      wrapperHeight: 400,
      wrapperWidth: 200,
      viewportHeight: 220,
      viewportWidth: 1200,
    });

    syncClasses();

    expect(getWrapper().style.maxHeight).toBe('204px');
    expect(getWrapper().style.overflowY).toBe('auto');
  });
});
