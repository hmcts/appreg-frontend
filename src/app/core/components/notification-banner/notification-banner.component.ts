import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

type BannerVariant = 'default' | 'success';

@Component({
  selector: 'app-notification-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: 'notification-banner.component.html',
})
export class NotificationBannerComponent implements AfterViewInit {
  @Input() variant: BannerVariant = 'default';
  @Input() title = 'Important';
  @Input() heading = '';
  @Input() body = '';
  @Input() linkText?: string;
  @Input() linkHref?: string;
  @Input() linkCommands?: string[];
  @Input() autoFocus = false;

  @ViewChild('bannerEl') private readonly bannerEl?: ElementRef<HTMLDivElement>;

  private static nextId = 0;
  titleId = `govuk-notification-banner-title-${NotificationBannerComponent.nextId++}`;

  get role(): 'region' | 'alert' {
    return this.variant === 'success' ? 'alert' : 'region';
  }

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      setTimeout(() => this.bannerEl?.nativeElement.focus(), 0);
    }
  }
}
