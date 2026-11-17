import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
/**
 * BreadcrumbsComponent
 *
 * Functionality:
 * - Displays breadcrumb navigation from supplied items.
 * - Renders each label as a router link to its supplied path.
 */
@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  templateUrl: './breadcrumbs.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink],
})
export class BreadcrumbsComponent {
  items = input<{ label: string; link: string }[]>([]);
}
