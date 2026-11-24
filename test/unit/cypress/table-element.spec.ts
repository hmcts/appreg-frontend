import { TableElement } from '../../../cypress/support/pageobjects/generic/table/TableElement';

jest.mock('../../../cypress/support/helper/table/TableSearch', () => ({
  TableSearch: {},
}));

describe('TableElement toolbar selectors', () => {
  const originalCy = Object.getOwnPropertyDescriptor(globalThis, 'cy');
  const originalCypress = Object.getOwnPropertyDescriptor(
    globalThis,
    'Cypress',
  );

  afterEach(() => {
    document.body.innerHTML = '';
    if (originalCy) {
      Object.defineProperty(globalThis, 'cy', originalCy);
    } else {
      Reflect.deleteProperty(globalThis, 'cy');
    }
    if (originalCypress) {
      Object.defineProperty(globalThis, 'Cypress', originalCypress);
    } else {
      Reflect.deleteProperty(globalThis, 'Cypress');
    }
  });

  it.each(['Standard applicants', 'Application list entries'])(
    'finds actions outside the caption for %s without selecting another table',
    (caption) => {
      document.body.innerHTML = ['Another table', caption]
        .map(
          (name) => `
            <app-sortable-table>
              <div tableActions>
                <button class="moj-button-menu__toggle-button">Actions</button>
                <div class="moj-button-menu__wrapper">
                  <button class="moj-button-menu__item">Export CSV</button>
                </div>
              </div>
              <table><caption class="govuk-visually-hidden">${name}</caption></table>
            </app-sortable-table>`,
        )
        .join('');

      let selected: Element | null = null;
      const chain = {
        contains: (selector: string, text: string) => {
          selected =
            [...document.querySelectorAll(selector)].find((element) =>
              element.textContent?.includes(text),
            ) ?? null;
          return chain;
        },
        closest: (selector: string) => {
          selected = selected?.closest(selector) ?? null;
          return chain;
        },
        find: (selector: string) => {
          selected = selected?.querySelector(selector) ?? null;
          return chain;
        },
        filter: (
          predicate: (index: number, element: HTMLElement) => boolean,
        ) => {
          expect(selected).not.toBeNull();
          expect(predicate(0, selected as HTMLElement)).toBe(true);
          return chain;
        },
        first: () => selected,
      };
      Object.defineProperty(globalThis, 'cy', {
        configurable: true,
        value: chain,
      });
      Object.defineProperty(globalThis, 'Cypress', {
        configurable: true,
        value: {
          $: (element: Element) => ({ text: () => element.textContent }),
        },
      });

      const table = document.querySelectorAll('app-sortable-table')[1];
      expect(TableElement.getCaptionMenuToggle(caption, 'Actions')).toBe(
        table.querySelector('.moj-button-menu__toggle-button'),
      );
      expect(TableElement.getCaptionMenuItem(caption, 'Export CSV')).toBe(
        table.querySelector('.moj-button-menu__wrapper button'),
      );
    },
  );
});
