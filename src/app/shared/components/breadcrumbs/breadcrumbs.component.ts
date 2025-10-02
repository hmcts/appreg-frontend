import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  templateUrl: './breadcrumbs.component.html',
})
export class BreadcrumbsComponent {
  @Input() items: { label: string; link: string }[] = [];
}
