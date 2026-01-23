import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  private readonly _isVisible = signal<boolean>(true);

  readonly isVisible = this._isVisible.asReadonly();

  showNavigation(): void {
    setTimeout(() => {
      this._isVisible.set(true);
    });
  }

  hideNavigation(): void {
    setTimeout(() => {
      this._isVisible.set(false);
    }, 0);
  }
}
