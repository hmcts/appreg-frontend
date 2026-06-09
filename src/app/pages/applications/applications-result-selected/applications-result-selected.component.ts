import { Component, computed, signal } from '@angular/core';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { SuccessBanner } from '@core-types/banner/banner.types';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';

@Component({
  selector: 'app-applications-result-selected',
  imports: [
    BreadcrumbsComponent,
    ErrorSummaryComponent,
    SuccessBannerComponent,
  ],
  templateUrl: './applications-result-selected.component.html',
  styleUrl: './applications-result-selected.component.scss',
})
export class ApplicationsResultSelectedComponent {
  successBanner = signal<SuccessBanner | null>(null);

  errorSummaryItems = signal<ErrorItem[]>([]);
  errorFound = computed(() => this.errorSummaryItems().length > 0);

  isSubmitting = signal(false);

  onCreateErrorClick = onCreateErrorClickFn;
}
