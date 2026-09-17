import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  input,
} from '@angular/core';

@Component({
  selector: 'app-async-job-progress',
  standalone: true,
  templateUrl: './async-job-progress.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './async-job-progress.component.scss',
})
export class AsyncJobProgressComponent implements AfterViewInit {
  heading = input.required<string>();
  body = input.required<string>();

  @ViewChild('progressEl')
  private readonly progressEl?: ElementRef<HTMLElement>;

  // Focus component after init
  ngAfterViewInit(): void {
    setTimeout(() => this.progressEl?.nativeElement.focus(), 0);
  }
}
