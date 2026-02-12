import { Routes } from '@angular/router';

import { Applications } from '@components/applications/applications.component';
import { ApplicationsListCreate } from '@components/applications-list/applications-list-create/applications-list-create.component';
import { ApplicationsListDeleteComponent } from '@components/applications-list/applications-list-delete/applications-list-delete.component';
import { ApplicationsList } from '@components/applications-list/applications-list.component';
import { ApplicationsListBulkUpload } from '@components/applications-list-bulk-upload/applications-list-bulk-upload.component';
import { ApplicationsListDetailListDetailsComponent } from '@components/applications-list-detail/applications-list-detail-list-details/applications-list-detail-list-details.component';
import { ApplicationsListDetail } from '@components/applications-list-detail/applications-list-detail.component';
import { ApplicationsListEntryCreate } from '@components/applications-list-entry-create/applications-list-entry-create.component';
import { ApplicationsListEntryDetail } from '@components/applications-list-entry-detail/applications-list-entry-detail.component';
import { PaymentReferenceEditComponent } from '@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component';
import { ForbiddenComponent } from '@components/global-error/forbidden/forbidden.component';
import { InternalErrorComponent } from '@components/global-error/internal-error/internal-error.component';
import { NotFoundComponent } from '@components/global-error/not-found/not-found.component';
import { HomeComponent } from '@components/home/home.component';
import { Login } from '@components/login/login.component';
import { Reports } from '@components/reports/reports.component';
import { ResultSelected } from '@components/result-selected/result-selected.component';
import { StandardApplicants } from '@components/standard-applicants/standard-applicants.component';
import { sessionGuard } from '@guards/session.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
  },
  { path: 'login', component: Login },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: 'internal-error', component: InternalErrorComponent },
  { path: 'page-not-found', component: NotFoundComponent },
  {
    path: 'applications-list',
    canActivate: [sessionGuard],
    children: [
      { path: '', component: ApplicationsList },
      { path: 'create', component: ApplicationsListCreate },
      { path: ':id', component: ApplicationsListDetail },
      {
        path: ':id#list-details',
        component: ApplicationsListDetailListDetailsComponent,
      },
      { path: ':id/update', component: ApplicationsListEntryDetail },
      { path: ':id/delete', component: ApplicationsListDeleteComponent },
      {
        path: ':id/update/change-payment-reference',
        component: PaymentReferenceEditComponent,
      },
      { path: ':id/create', component: ApplicationsListEntryCreate },
      { path: ':id/bulk-upload', component: ApplicationsListBulkUpload },
      { path: ':id/result-selected', component: ResultSelected },
    ],
  },
  {
    path: 'applications',
    component: Applications,
    canActivate: [sessionGuard],
  },
  {
    path: 'standard-applicants',
    component: StandardApplicants,
    canActivate: [sessionGuard],
  },
  {
    path: 'reports',
    component: Reports,
    canActivate: [sessionGuard],
  },
  { path: '**', redirectTo: 'page-not-found' },
];
