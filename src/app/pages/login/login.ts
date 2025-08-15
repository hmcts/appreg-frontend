import { Component, Inject, Optional, PLATFORM_ID } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  constructor(
    @Optional() private msal: MsalService | null,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  loggingIn = false;

  signIn(e: Event): void {
    e.preventDefault();
    if (this.loggingIn) {
      return;
    }

    if (!isPlatformBrowser(this.platformId) || !this.msal) {
      return;
    }

    this.loggingIn = true;
    this.msal
      .loginRedirect({ scopes: ['openid', 'profile', 'email'] })
      .subscribe({ error: () => (this.loggingIn = false) });
  }
}
