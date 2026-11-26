import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';

export type BannerSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; href?: string; commands?: string[] };

/**
 * SuccessBannerComponent
 *
 * Functionality:
 * - Displays a success banner.
 * - Supports links, click events, and focus management.
 * - Can render segmented content and an optional link action.
 */
@Component({
  selector: 'app-success-banner',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: 'success-banner.component.html',
})
export class SuccessBannerComponent implements AfterViewInit {
  heading = input('Done');
  bannerRole = input<'alert' | 'region'>('alert');
  body = input('');
  linkText = input<string | undefined>(undefined);
  linkHref = input<string | undefined>(undefined);
  linkCommands = input<string[] | undefined>(undefined);
  autoFocus = input(true);
  segments = input<BannerSegment[]>([]);
  allowOnClick = input(false);
  linkClick = output<void>();

  @ViewChild('bannerEl') private readonly bannerEl?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    if (this.autoFocus()) {
      setTimeout(() => this.bannerEl?.nativeElement.focus(), 0);
    }
  }
}
