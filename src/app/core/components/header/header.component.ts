import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * HeaderComponent
 *
 * Functionality:
 * - Displays the application header.
 * - Provides the GOV.UK branded header markup.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './header.component.html',
})
export class HeaderComponent {}
