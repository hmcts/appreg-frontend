/**
 * Login
 * Main Component for page /login
 *
 * Functionality:
 * goLogin():
 * - Redirects the user to the SSO login endpoint
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
})
export class Login {
  goLogin(): void {
    globalThis.location.href = '/sso/login';
  }
}
