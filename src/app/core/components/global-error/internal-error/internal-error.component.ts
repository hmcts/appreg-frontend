import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * InternalErrorComponent
 *
 * Functionality:
 * - Displays the internal error page.
 * - Provides the application error message for unexpected failures.
 */
@Component({
  selector: 'app-internal-error',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './internal-error.component.html',
})
export class InternalErrorComponent {}
