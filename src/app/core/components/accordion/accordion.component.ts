import { CommonModule } from '@angular/common';
import { Component, TemplateRef, effect, input, signal } from '@angular/core';

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
  templateUrl: './accordion.component.html',
})
export class AccordionComponent {
  /** Root id used to build per-section ids (must be unique on the page) */
  readonly id = input('accordion');
  /** Sections to render */
  readonly items = input<AccordionItem[]>([]);
  /** Allow multiple sections open at the same time */
  readonly allowMultiple = input<boolean>(true);

  /** Local state derived from input items so toggling doesn't mutate inputs. */
  readonly displayItems = signal<AccordionItem[]>([]);

  constructor() {
    effect(() => {
      this.displayItems.set(this.items());
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
      return;
    }
    const updated = current.map((item, idx) =>
      idx === i ? { ...item, expanded: !item.expanded } : item,
    );
    this.displayItems.set(updated);
  }

  headingId(i: number): string {
    return `${this.id()}-heading-${i + 1}`;
  }

  panelId(i: number): string {
    return `${this.id()}-content-${i + 1}`;
  }
}
