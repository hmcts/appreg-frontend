import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

type Indexable = Record<string, unknown>;

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suggestions.component.html',
})
export class SuggestionsComponent<T = unknown> implements OnChanges {
  @Input() id = '';
  @Input() label = '';
  @Input() hint = '';
  @Input() disabled = false;
  @Input() showError = false;
  @Input() errorText = 'This field is required';
  @Input({ required: true }) suggestions: T[] = [];
  @Input() search = '';
  @Output() searchChange = new EventEmitter<string>();
  @Input() getItemLabel: ((item: T) => string) | null = null;
  @Output() selectItem = new EventEmitter<T>();
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @Input() widthClass = 'govuk-input--width-10';
  @Input() containerWidthClass = 'govuk-grid-column-one-quarter';

  private focused = false;
  private justSelected = false;
  private committedLabel: string | null = null;

  onInput(v: string): void {
    this.search = v;
    this.searchChange.emit(v);

    this.justSelected = false;
    if (!this.hasQuery || !this.isCommittedText) {
      this.committedLabel = null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const sc = changes['search'];
    const next = this.asString(sc?.currentValue);

    if (next === null) {
      return;
    }

    const trimmed = next.trim();
    // If parent sets a value programmatically (e.g. hydrate), treat it as committed
    // so we don't show "No results found" when suggestions is empty.
    if (!this.focused && trimmed) {
      this.committedLabel = next;
      this.justSelected = true;
      return;
    }

    // If search cleared externally, clear committed state
    if (!trimmed) {
      this.committedLabel = null;
      this.justSelected = false;
    }
  }

  private asString(v: unknown): string | null {
    return typeof v === 'string' ? v : null;
  }

  onFocus(): void {
    this.focused = true;
  }

  onBlur(): void {
    setTimeout(() => (this.focused = false), 0);
  }

  labelFor(item: T): string {
    if (this.getItemLabel) {
      return this.getItemLabel(item);
    }
    if (this.isIndexable(item)) {
      const name = item['name'];
      if (typeof name === 'string') {
        return name;
      }
      const desc = item['description'];
      if (typeof desc === 'string') {
        return desc;
      }
    }
    return String(item as unknown);
  }

  choose(item: T, e: MouseEvent): void {
    e.preventDefault();
    this.selectItem.emit(item);

    const label = this.labelFor(item);
    this.search = label;
    this.committedLabel = label;

    this.suggestions = [];
    this.justSelected = true;
  }

  labelOf(item: T): string {
    if (item === null) {
      return '';
    }
    if (typeof item === 'string') {
      return item;
    }
    const o = item as { name?: string; description?: string; code?: string };
    return o.name ?? o.description ?? o.code ?? '';
  }

  get noResultsVisible(): boolean {
    return (
      this.focused &&
      this.hasQuery &&
      (this.suggestions?.length ?? 0) === 0 &&
      !this.isCommittedText &&
      !this.justSelected &&
      !this.disabled
    );
  }

  get open(): boolean {
    return (
      !this.disabled &&
      !!this.search?.trim() &&
      !this.isCommittedText &&
      (this.suggestions?.length ?? 0) > 0
    );
  }

  get hasQuery(): boolean {
    return !!this.search?.trim();
  }
  get isCommittedText(): boolean {
    return (
      !!this.committedLabel &&
      this.norm(this.search) === this.norm(this.committedLabel)
    );
  }

  private isIndexable(x: unknown): x is Indexable {
    return typeof x === 'object' && x !== null;
  }

  private norm(s: string | null | undefined) {
    return (s ?? '').trim().toLowerCase();
  }
}
