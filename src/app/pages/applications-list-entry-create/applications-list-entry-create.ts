import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-applications-list-entry-create',
  standalone: true,
  imports: [BreadcrumbsComponent],
  templateUrl: './applications-list-entry-create.html',
})
export class ApplicationsListEntryCreate implements OnInit {
  id: string = '';

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
  }

  buildReturnLink(): { label: string; link: string } {
    return { label: 'Back to list', link: `/applications-list/${this.id}` };
  }
}
