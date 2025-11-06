import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AccordionComponent } from '../../shared/components/accordion/accordion.component';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { SortableTableComponent, TableColumn } from '../../shared/components/sortable-table/sortable-table.component';
import { MojButtonMenuDirective } from '../../shared/util/moj-button-menu';

@Component({
  selector: 'app-applications-list-entry-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
    AccordionComponent,
    MojButtonMenuDirective,
    SortableTableComponent,
  ],
  templateUrl: './applications-list-entry-detail.html',
})
export class ApplicationsListEntryDetail implements OnInit {
  appListId!: string;
  formSubmitted = false;
  entryType = new FormControl<'Person' | 'Organisation' | 'Standard Applicant'>(
    'Organisation',
  );
  personOpen = false;

  columns: TableColumn[] = [
    { header: 'Code', field: 'code', numeric: true  },
    { header: 'Name', field: 'name' },
    { header: 'Address line 1', field: 'address' },
    { header: 'Use from', field: 'useFrom' },
    { header: 'Use to', field: 'useTo' },
  ];

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const nav = this.router.currentNavigation();
    const fromNav = nav?.extras?.state as { appListId?: string } | undefined;
    const fromHist = isPlatformBrowser(this.platformId)
      ? (history.state as { appListId?: string } | undefined)
      : undefined;

    this.appListId =
      fromNav?.appListId ??
      fromHist?.appListId ??
      this.route.snapshot.queryParamMap.get('appListId') ??
      '';

    this.entryType.valueChanges.subscribe((v) => {
      if (v !== 'Person') {
        this.personOpen = false;
      }
    });
  }

  onSubmit(): void {
    this.formSubmitted = true;
  }
}
