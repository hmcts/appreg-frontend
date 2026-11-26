import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { HeaderService } from '@services/header.service';
import { SessionService } from '@services/session.service';

/**
 * NotFoundComponent
 *
 * Functionality:
 * - Displays the not found page.
 * - Refreshes session state when the page opens.
 * - Provides navigation options based on authentication state.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent implements OnInit, OnDestroy {
  headerService = inject(HeaderService);
  sessionService = inject(SessionService);
  readonly isAuthenticated = this.sessionService.isAuthenticated;

  ngOnInit(): void {
    this.headerService.hideNavigation();
    void this.sessionService.refresh();
  }

  ngOnDestroy(): void {
    this.headerService.showNavigation();
  }
}
