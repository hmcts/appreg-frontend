import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';

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
  @Input() id = 'accordion';
  /** Sections to render */
  @Input() items: AccordionItem[] = [];
  /** Allow multiple sections open at the same time */
  @Input() allowMultiple = true;

  toggle(i: number): void {
    if (!this.allowMultiple) {
      this.items = this.items.map((it, idx) =>
        idx === i
          ? { ...it, expanded: !it.expanded }
          : { ...it, expanded: false },
      );
      return;
    }
    this.items[i] = { ...this.items[i], expanded: !this.items[i].expanded };
    this.items = [...this.items];
  }

  headingId(i: number): string {
    return `${this.id}-heading-${i + 1}`;
  }

  panelId(i: number): string {
    return `${this.id}-content-${i + 1}`;
  }
}
