import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  private readonly _isVisible = signal<boolean>(true);

  readonly isVisible = this._isVisible.asReadonly();

  showNavigation(): void {
    this._isVisible.set(true);
  }

  hideNavigation(): void {
    this._isVisible.set(false);
  }
}
