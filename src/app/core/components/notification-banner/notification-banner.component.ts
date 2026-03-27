import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

type BannerVariant = 'default' | 'success' | 'warning';

@Component({
  selector: 'app-notification-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: 'notification-banner.component.html',
})
export class NotificationBannerComponent implements AfterViewInit {
  variant = input<BannerVariant>('default');
  title = input('Important');
  heading = input('');
  body = input('');
  linkText = input<string | undefined>();
  linkHref = input<string | undefined>();
  linkCommands = input<string[] | undefined>();
  autoFocus = input(false);

  @ViewChild('bannerEl') private readonly bannerEl?: ElementRef<HTMLDivElement>;

  private static nextId = 0;
  titleId = `govuk-notification-banner-title-${NotificationBannerComponent.nextId++}`;

  get role(): 'region' | 'alert' {
    return this.variant() === 'success' ? 'alert' : 'region';
  }

  ngAfterViewInit(): void {
    if (this.autoFocus()) {
      setTimeout(() => this.bannerEl?.nativeElement.focus(), 0);
    }
  }
}
