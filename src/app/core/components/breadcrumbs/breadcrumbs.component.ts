import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  templateUrl: './breadcrumbs.component.html',
  imports: [RouterLink],
})
export class BreadcrumbsComponent {
  items = input<{ label: string; link: string }[]>([]);
}
