import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
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
  @Input() heading = 'Done';
  @Input() body = '';
  @Input() linkText?: string;
  @Input() linkHref?: string;
  @Input() linkCommands?: string[];
  @Input() autoFocus = true;
  @Input() segments: BannerSegment[] = [];

  @ViewChild('bannerEl') private readonly bannerEl?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      setTimeout(() => this.bannerEl?.nativeElement.focus(), 0);
    }
  }
}
