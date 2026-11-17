import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * FooterComponent
 *
 * Functionality:
 * - Displays the application footer.
 * - Provides support contact details and licence information.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './footer.component.html',
})
export class FooterComponent {}
