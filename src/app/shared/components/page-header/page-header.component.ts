import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';

type ButtonVariant = 'primary' | 'secondary' | 'warning';
export type PageHeaderAction = {
  label: string;
  routerLink?: string | string[]; // e.g. ['create'] or '/path'
  href?: string; // external link fallback
  startIcon?: boolean; // GOV.UK “start” arrow
  variant?: ButtonVariant; // maps to govuk-button modifiers
  disabled?: boolean;
  id?: string;
  queryParams?: Params;
  // If you need a click handler without navigation:
  onClick?: (this: void, ev: Event) => void;
};

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() actions: PageHeaderAction[] = [];

  /** GOV.UK heading size: xl | l | m | s */
  @Input() size: 'xl' | 'l' | 'm' | 's' = 'xl';

  get headingClass(): string {
    switch (this.size) {
      case 'l':
        return 'govuk-heading-l';
      case 'm':
        return 'govuk-heading-m';
      case 's':
        return 'govuk-heading-s';
      default:
        return 'govuk-heading-xl';
    }
  }

  // class helpers for variants
  isSecondary(a: PageHeaderAction): boolean {
    return a.variant === 'secondary';
  }
  isWarning(a: PageHeaderAction): boolean {
    return a.variant === 'warning';
  }
}
