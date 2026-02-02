import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-internal-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './internal-error.component.html',
})
export class InternalErrorComponent {}
