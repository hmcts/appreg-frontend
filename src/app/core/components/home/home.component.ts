import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

import { SessionService } from '@services/session.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class HomeComponent implements OnInit {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      void this.run();
    }
  }

  private async run(): Promise<void> {
    const authed = await this.session.refresh();
    await this.router.navigateByUrl(authed ? '/applications-list' : '/login');
  }
}
