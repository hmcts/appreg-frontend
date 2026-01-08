import { Routes } from '@angular/router';

import { sessionGuard } from './guards/session.guard';

import { Applications } from '@components/applications/applications';
import { ApplicationsList } from '@components/applications-list/applications-list';
import { ApplicationsListBulkUpload } from '@components/applications-list-bulk-upload/applications-list-bulk-upload';
import { ApplicationsListCreate } from '@components/applications-list-create/applications-list-create';
import { ApplicationsListDetail } from '@components/applications-list-detail/applications-list-detail';
import { ApplicationsListEntryCreate } from '@components/applications-list-entry-create/applications-list-entry-create';
import { ApplicationsListEntryDetail } from '@components/applications-list-entry-detail/applications-list-entry-detail';
import { Login } from '@components/login/login';
import { Reports } from '@components/reports/reports';
import { ResultSelected } from '@components/result-selected/result-selected';
import { StandardApplicants } from '@components/standard-applicants/standard-applicants';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'applications-list',
    canActivate: [sessionGuard],
    children: [
      { path: '', component: ApplicationsList },
      { path: 'create', component: ApplicationsListCreate },
      { path: ':id', component: ApplicationsListDetail },
      { path: ':id/update', component: ApplicationsListEntryDetail },
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
  { path: '**', redirectTo: 'login' },
];
