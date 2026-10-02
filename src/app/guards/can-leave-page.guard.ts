import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

export interface CanLeavePage {
  canLeave(): boolean | Observable<boolean>;
}

export const canLeavePageGuard: CanDeactivateFn<CanLeavePage> = (component) =>
  component.canLeave();
