import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Indexable = Record<string, unknown>;

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suggestions.component.html',
})
export class SuggestionsComponent<T = unknown> {
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

  choose(item: T, e: Event): void {
    e.preventDefault();
    this.selectItem.emit(item);
    const label = this.labelOf(item);
    this.search = label;
    this.committedLabel = label;
    this.suggestions = [];
    this.justSelected = true; // suppress empty once
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
