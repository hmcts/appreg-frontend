import { Component, input } from '@angular/core';

@Component({
  selector: 'app-warning-banner',
  imports: [],
  templateUrl: './warning-banner.component.html',
})
export class WarningBannerComponent {
  message = input.required<string>();
}
