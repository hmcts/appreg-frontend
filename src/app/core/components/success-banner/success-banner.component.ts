import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';

export type BannerSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; href?: string; commands?: string[] };

@Component({
  selector: 'app-success-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: 'success-banner.component.html',
})
export class SuccessBannerComponent implements AfterViewInit {
  heading = input('Done');
  body = input('');
  linkText = input<string | undefined>(undefined);
  linkHref = input<string | undefined>(undefined);
  linkCommands = input<string[] | undefined>(undefined);
  autoFocus = input(true);
  segments = input<BannerSegment[]>([]);

  @ViewChild('bannerEl') private readonly bannerEl?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    if (this.autoFocus()) {
      setTimeout(() => this.bannerEl?.nativeElement.focus(), 0);
    }
  }
}
