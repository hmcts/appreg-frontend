import {
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Optional,
  Output,
  PLATFORM_ID,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgIf, isPlatformBrowser } from '@angular/common';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-service-navigation',
  templateUrl: './service-navigation.component.html',
  imports: [RouterLinkActive, RouterLink, NgIf],
})
export class ServiceNavigationComponent implements OnInit {
  isLoginPage = false;
  loggingOut = false;

  @Output() signOut = new EventEmitter<void>();

  constructor(
    private router: Router,
    @Optional() private msal: MsalService | null, // SSR-safe
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.isLoginPage = e.urlAfterRedirects === '/login';
      });
  }

  onSignOutClicked(e: Event): void {
    e.preventDefault();
    if (this.loggingOut) {
      return;
    }
    this.loggingOut = true;

    // Prefer MSAL logout (clears cache + hits Entra logout)
    if (isPlatformBrowser(this.platformId) && this.msal) {
      const postLogoutRedirectUri = `${window.location.origin}/login`; // or '/'
      this.msal.logoutRedirect({ postLogoutRedirectUri }).subscribe({
        next: () => this.signOut.emit(),
        error: () => {
          this.loggingOut = false;
          // Fallback: hard navigate to login
          window.location.href = postLogoutRedirectUri;
        },
      });
      return;
    }

    // Fallback if running during SSR or MSAL not available
    this.signOut.emit();
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = '/login';
    }
  }
}
