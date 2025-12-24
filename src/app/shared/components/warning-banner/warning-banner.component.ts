import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-warning-banner',
  imports: [],
  templateUrl: './warning-banner.component.html',
})
export class WarningBannerComponent {
  @Input({ required: true }) message!: string;
}
