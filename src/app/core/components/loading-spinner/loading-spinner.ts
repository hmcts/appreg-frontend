import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  imports: [NgClass],
  templateUrl: './loading-spinner.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loading-spinner.scss',
})
export class LoadingSpinner {
  text = input('Loading...');
  size = input<'small' | undefined>();
}
