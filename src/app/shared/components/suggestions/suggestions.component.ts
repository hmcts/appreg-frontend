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

  onInput(v: string): void {
    this.search = v;
    this.searchChange.emit(v);
  }

  private isIndexable(x: unknown): x is Indexable {
    return typeof x === 'object' && x !== null;
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

  choose(item: T, ev: Event): void {
    ev.preventDefault();
    this.selectItem.emit(item);
  }

  labelOf(item: unknown): string {
    if (item === null) {
      return '';
    }
    if (typeof item === 'string') {
      return item;
    }
    const o = item as { name?: string; description?: string; code?: string };
    return o.name ?? o.description ?? o.code ?? '';
  }

  get open(): boolean {
    return (
      !this.disabled &&
      !!this.search?.trim() &&
      (this.suggestions?.length ?? 0) > 0
    );
  }
}
