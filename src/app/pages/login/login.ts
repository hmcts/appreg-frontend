import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  goLogin(): void {
    window.location.href = '/sso/login';
  }
}
