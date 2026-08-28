import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  PLATFORM_ID,
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private expansionObserver?: MutationObserver;

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

  // Used in app list entry create/details for app code selection
  // scrolls to the first expanded section.
  // Indexes are the accordion sections to focus on
  // in the order of items passed into this component.
  scrollToFirstExpandedSection(indexes: number[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    afterNextRender(
      () => {
        const sections =
          this.root()?.nativeElement.querySelectorAll<HTMLElement>(
            '.govuk-accordion__section',
          );
        const section = indexes
          .map((index) => sections?.[index])
          .find((candidate) =>
            candidate?.classList.contains('govuk-accordion__section--expanded'),
          );

        section
          ?.querySelector<HTMLElement>('.govuk-accordion__section-button')
          ?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      },
      { injector: this.injector },
    );
  }

  private syncExpandedState(items: AccordionItem[]): void {
    const root = this.root()?.nativeElement;
    if (!root) {
      return;
    }

    this.observeGovUkExpansionState(root);

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

  // Sync show/collapse all
  private observeGovUkExpansionState(root: HTMLElement): void {
    if (this.expansionObserver || typeof MutationObserver === 'undefined') {
      return;
    }

    this.expansionObserver = new MutationObserver(() => {
      const sections = root.querySelectorAll<HTMLElement>(
        '.govuk-accordion__section',
      );
      const current = this.displayItems();
      const changes = Array.from(sections).flatMap((section, index) => {
        const item = current[index];
        const expanded = section.classList.contains(
          'govuk-accordion__section--expanded',
        );

        return item && item.expanded !== expanded ? [{ index, expanded }] : [];
      });

      if (!changes.length) {
        return;
      }

      this.displayItems.update((items) =>
        items.map((item, index) => {
          const change = changes.find(
            ({ index: changedIndex }) => changedIndex === index,
          );
          return change ? { ...item, expanded: change.expanded } : item;
        }),
      );
      changes.forEach((change) => this.expandedChange.emit(change));
    });
    this.expansionObserver.observe(root, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    this.destroyRef.onDestroy(() => this.expansionObserver?.disconnect());
  }

  headingId(i: number): string {
    return `${this.id()}-heading-${i + 1}`;
  }

  panelId(i: number): string {
    return `${this.id()}-content-${i + 1}`;
  }
}
