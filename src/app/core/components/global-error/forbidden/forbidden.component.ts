import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  input,
} from '@angular/core';

import { HeaderService } from '@services/header.service';

/**
 * ForbiddenComponent
 *
 * Functionality:
 * - Displays the forbidden page.
 * - Accepts an optional heading for access-denied messaging.
 * - Hides service navigation while the page is active.
 */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './forbidden.component.html',
})
export class ForbiddenComponent implements OnInit, OnDestroy {
  headerService = inject(HeaderService);

  header = input<string>();

  ngOnInit(): void {
    this.headerService.hideNavigation();
  }

  ngOnDestroy(): void {
    this.headerService.showNavigation();
  }
}
