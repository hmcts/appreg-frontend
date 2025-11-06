import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-applications-list-entry-update',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
  ],
  templateUrl: './applications-list-entry-update.html',
})
export class ApplicationsListEntryUpdate implements OnInit {
  appListId!: string;
  formSubmitted = false;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const nav = this.router.currentNavigation();
    const fromNav = nav?.extras?.state as { appListId?: string } | undefined;
    const fromHist = isPlatformBrowser(this.platformId)
      ? (history.state as { appListId?: string } | undefined)
      : undefined;

    this.appListId =
      fromNav?.appListId ??
      fromHist?.appListId ??
      this.route.snapshot.queryParamMap.get('appListId') ??
      '';
  }

  onSubmit(): void {
    this.formSubmitted = true;
  }
}
