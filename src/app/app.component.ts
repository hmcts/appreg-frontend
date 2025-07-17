import {Component, OnInit} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';
import {AuthService} from "./services/auth.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  isLoginPage = false;

  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd)
      )
      .subscribe((e: NavigationEnd): void => {
        this.isLoginPage = e.urlAfterRedirects === '/login';
      });
  }

  onSignOut(evt: MouseEvent) {
    evt.preventDefault();
    if (confirm('Are you sure you want to sign out?')) {
      this.auth.logout();
      this.router.navigate(['/login']);
    }
  }
}
