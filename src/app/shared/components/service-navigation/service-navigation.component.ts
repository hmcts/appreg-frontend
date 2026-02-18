import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

import { HeaderService } from '@services/header.service';
import { SessionService } from '@services/session.service';

@Component({
  selector: 'app-service-navigation',
  templateUrl: './service-navigation.component.html',
  standalone: true,
  imports: [RouterLinkActive, RouterLink],
})
export class ServiceNavigationComponent {
  readonly session = inject(SessionService);
  private readonly header = inject(HeaderService);
  private readonly router = inject(Router);

  readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isLoginPage = computed(() => this.url().startsWith('/login'));

  readonly showMenu = computed(
    () =>
      this.session.isAuthenticated() &&
      !this.isLoginPage() &&
      this.header.isVisible(),
  );
}
