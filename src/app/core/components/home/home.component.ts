import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { SessionService } from '@services/session.service';

@Component({
  standalone: true,
  template: '',
})
export class HomeComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  constructor() {
    void this.run();
  }

  private async run(): Promise<void> {
    const authed = await this.session.refresh();
    await this.router.navigateByUrl(authed ? '/applications-list' : '/login');
  }
}
