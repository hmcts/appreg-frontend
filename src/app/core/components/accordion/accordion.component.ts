import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injector,
  TemplateRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

export interface AccordionItem {
  heading: string;
  /** For simple text content */
  content?: string;
  /** For rich/HTML content */
  tpl?: TemplateRef<unknown>;
  /** If true, section starts expanded */
  expanded?: boolean;
}

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './accordion.component.html',
})
export class AccordionComponent {
  /** Root id used to build per-section ids (must be unique on the page) */
  id = input('accordion');
  /** Sections to render */
  items = input<AccordionItem[]>([]);
  /** Allow multiple sections open at the same time */
  allowMultiple = input<boolean>(true);

  rememberExpanded = input<boolean>(true);
  expandedChange = output<{ index: number; expanded: boolean }>();

  /** Local state derived from input items so toggling doesn't mutate inputs. */
  displayItems = signal<AccordionItem[]>([]);
  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const items = this.items();
      this.displayItems.set(items);
      afterNextRender(() => this.syncExpandedState(items), {
        injector: this.injector,
      });
    });
  }

  toggle(i: number): void {
    const current = this.displayItems();
    if (!current.length) {
      return;
    }
    if (!this.allowMultiple()) {
      const updated = current.map((item, idx) =>
        idx === i
          ? { ...item, expanded: !item.expanded }
          : { ...item, expanded: false },
      );
      this.displayItems.set(updated);
      this.expandedChange.emit({ index: i, expanded: !current[i].expanded });
      return;
    }
    const updated = current.map((item, idx) =>
      idx === i ? { ...item, expanded: !item.expanded } : item,
    );
    this.displayItems.set(updated);
    this.expandedChange.emit({ index: i, expanded: !current[i].expanded });
  }

  @HostListener('click', ['$event'])
  onRootClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const root = this.root()?.nativeElement;
    const section = target.closest<HTMLElement>('.govuk-accordion__section');
    if (!root || !section || !root.contains(section)) {
      return;
    }

    const index = Array.from(
      root.querySelectorAll('.govuk-accordion__section'),
    ).indexOf(section);
    if (index >= 0) {
      this.expandedChange.emit({
        index,
        expanded: section.classList.contains(
          'govuk-accordion__section--expanded',
        ),
      });
    }
  }

  private syncExpandedState(items: AccordionItem[]): void {
    const root = this.root()?.nativeElement;
    if (!root) {
      return;
    }

    const sections = root.querySelectorAll<HTMLElement>(
      '.govuk-accordion__section',
    );
    items.forEach((item, index) => {
      const section = sections[index];
      if (!section) {
        return;
      }

      const expanded = item.expanded === true;
      section.classList.toggle('govuk-accordion__section--expanded', expanded);

      const content = section.querySelector<HTMLElement>(
        '.govuk-accordion__section-content',
      );
      if (content) {
        if (expanded) {
          content.removeAttribute('hidden');
        } else {
          content.setAttribute('hidden', 'until-found');
        }
      }

      section
        .querySelector<HTMLElement>('.govuk-accordion__section-button')
        ?.setAttribute('aria-expanded', String(expanded));
    });
  }

  headingId(i: number): string {
    return `${this.id()}-heading-${i + 1}`;
  }

  panelId(i: number): string {
    return `${this.id()}-content-${i + 1}`;
  }
}
