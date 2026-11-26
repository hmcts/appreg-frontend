import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Login
 * Main Component for page /login
 *
 * Functionality:
 * goLogin():
 * - Redirects the user to the SSO login endpoint
 */
@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './login.component.html',
})
export class Login {
  goLogin(): void {
    globalThis.location.href = '/sso/login';
  }
}
