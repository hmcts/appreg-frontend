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
