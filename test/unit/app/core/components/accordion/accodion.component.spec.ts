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

  it('uses the provided id as the root accordion id', () => {
    const root = fixture.debugElement.query(By.css('.govuk-accordion'));
    expect(root).toBeTruthy();
    expect((root.nativeElement as HTMLElement).id).toBe('my-accordion');
  });
});
