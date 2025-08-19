import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
})
export class Login {
  goLogin(): void {
    window.location.href = '/sso/login';
  }
}
