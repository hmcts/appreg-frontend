import { Component, input } from '@angular/core';

@Component({
  selector: 'app-async-job-progress',
  standalone: true,
  templateUrl: './async-job-progress.component.html',
  styleUrl: './async-job-progress.component.scss',
})
export class AsyncJobProgressComponent {
  heading = input.required<string>();
  body = input.required<string>();
}
