import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  imports: [NgClass],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.scss',
})
export class LoadingSpinner {
  text = input('Loading...');
  size = input<'small' | undefined>();
}
