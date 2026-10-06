import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AccordionComponent } from '@components/accordion/accordion.component';

describe('AccordionComponent', () => {
  let component: AccordionComponent;
  let fixture: ComponentFixture<AccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccordionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccordionComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('id', 'my-accordion');
    fixture.componentRef.setInput('items', [
      { heading: 'First section', content: 'First content', expanded: true },
      { heading: 'Second section', content: 'Second content', expanded: false },
    ]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the correct number of sections and headings', () => {
    const sections = fixture.debugElement.queryAll(
      By.css('.govuk-accordion__section'),
    );
    expect(sections).toHaveLength(2);

    const headings = sections.map((s) =>
      (s.nativeElement as HTMLElement)
        .querySelector('.govuk-accordion__section-button')
        ?.textContent?.trim(),
    );
    expect(headings).toEqual(['First section', 'Second section']);
  });

  it('sets aria-expanded and hidden based on item.expanded', () => {
    const buttons = fixture.debugElement.queryAll(
      By.css('.govuk-accordion__section-button'),
    );
    const panels = fixture.debugElement.queryAll(
      By.css('.govuk-accordion__section-content'),
    );

    expect(buttons).toHaveLength(2);
    expect(panels).toHaveLength(2);

    const firstButton = buttons[0].nativeElement as HTMLButtonElement;
    const secondButton = buttons[1].nativeElement as HTMLButtonElement;
    const firstPanel = panels[0].nativeElement as HTMLElement;
    const secondPanel = panels[1].nativeElement as HTMLElement;

    expect(firstButton.getAttribute('aria-expanded')).toBe('true');
    expect(firstPanel.hidden).toBe(false);

    expect(secondButton.getAttribute('aria-expanded')).toBe('false');
    expect(secondPanel.hidden).toBe(true);
  });

  it('toggles expanded state when a section button is clicked', () => {
    const buttons = fixture.debugElement.queryAll(
      By.css('.govuk-accordion__section-button'),
    );
    const panels = fixture.debugElement.queryAll(
      By.css('.govuk-accordion__section-content'),
    );

    const secondButton = buttons[1].nativeElement as HTMLButtonElement;
    const secondPanel = panels[1].nativeElement as HTMLElement;

    // Initially collapsed
    expect(secondButton.getAttribute('aria-expanded')).toBe('false');
    expect(secondPanel.hidden).toBe(true);

    // Click to expand
    secondButton.click();
    fixture.detectChanges();

    expect(secondButton.getAttribute('aria-expanded')).toBe('true');
    expect(secondPanel.hidden).toBe(false);

    // Click again to collapse
    secondButton.click();
    fixture.detectChanges();

    expect(secondButton.getAttribute('aria-expanded')).toBe('false');
    expect(secondPanel.hidden).toBe(true);
  });

  it('emits the changed section state when a user toggles it', () => {
    const expandedChange = jest.fn();
    component.expandedChange.subscribe(expandedChange);
    const secondButton = fixture.debugElement.queryAll(
      By.css('.govuk-accordion__section-button'),
    )[1].nativeElement as HTMLButtonElement;

    secondButton.click();

    expect(expandedChange).toHaveBeenCalledWith({ index: 1, expanded: true });
  });

  it('syncs GOV.UK show-all state changes back to Angular', async () => {
    const expandedChange = jest.fn();
    component.expandedChange.subscribe(expandedChange);
    const sections = fixture.debugElement.queryAll(
      By.css('.govuk-accordion__section'),
    );

    sections.forEach((section) =>
      (section.nativeElement as HTMLElement).classList.add(
        'govuk-accordion__section--expanded',
      ),
    );
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.displayItems().every((item) => item.expanded)).toBe(true);
    expect(expandedChange).toHaveBeenCalledWith({ index: 1, expanded: true });
  });

  it('syncs GOV.UK generated show/hide labels when item inputs change', async () => {
    const root = fixture.debugElement.query(By.css('.govuk-accordion'))
      .nativeElement as HTMLElement;
    const sections = fixture.debugElement.queryAll(
      By.css('.govuk-accordion__section'),
    );

    const controls = document.createElement('div');
    controls.className = 'govuk-accordion__controls';
    controls.innerHTML = `
      <button type="button" class="govuk-accordion__show-all" aria-expanded="false">
        <span class="govuk-accordion-nav__chevron govuk-accordion-nav__chevron--down"></span>
        <span class="govuk-accordion__show-all-text">Show all sections</span>
      </button>
    `;
    root.insertBefore(controls, root.firstChild);

    sections.forEach((section, index) => {
      const button = (section.nativeElement as HTMLElement).querySelector(
        '.govuk-accordion__section-button',
      );
      button?.setAttribute(
        'aria-label',
        index === 0
          ? 'First section , Hide this section'
          : 'Second section , Show this section',
      );
      button?.insertAdjacentHTML(
        'beforeend',
        '<span class="govuk-accordion__section-toggle"><span class="govuk-accordion-nav__chevron"></span><span class="govuk-accordion__section-toggle-text"></span></span>',
      );
    });

    fixture.componentRef.setInput('items', [
      { heading: 'First section', content: 'First content', expanded: false },
      { heading: 'Second section', content: 'Second content', expanded: true },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const toggleLabels = Array.from(
      root.querySelectorAll<HTMLElement>(
        '.govuk-accordion__section-toggle-text',
      ),
    ).map((label) => label.textContent);

    expect(toggleLabels).toEqual(['Show', 'Hide']);
    expect(
      Array.from(root.querySelectorAll('.govuk-accordion__section-button')).map(
        (button) => button.getAttribute('aria-label'),
      ),
    ).toEqual([
      'First section , Show this section',
      'Second section , Hide this section',
    ]);
    expect(
      root.querySelector('.govuk-accordion__show-all-text')?.textContent,
    ).toBe('Show all sections');
  });

  it('uses the provided id as the root accordion id', () => {
    const root = fixture.debugElement.query(By.css('.govuk-accordion'));
    expect(root).toBeTruthy();
    expect((root.nativeElement as HTMLElement).id).toBe('my-accordion');
  });

  it('scrolls to the first requested section that is expanded', async () => {
    const buttons = fixture.debugElement.queryAll(
      By.css('.govuk-accordion__section-button'),
    );
    const firstScrollIntoView = jest.fn();
    const secondScrollIntoView = jest.fn();
    (buttons[0].nativeElement as HTMLElement).scrollIntoView =
      firstScrollIntoView;
    (buttons[1].nativeElement as HTMLElement).scrollIntoView =
      secondScrollIntoView;

    component.scrollToFirstExpandedSection([1, 0]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(firstScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(secondScrollIntoView).not.toHaveBeenCalled();
  });
});
