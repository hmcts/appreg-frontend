import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-internal-error',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './internal-error.component.html',
})
export class InternalErrorComponent {}
