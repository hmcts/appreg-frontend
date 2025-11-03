import { Routes } from '@angular/router';

import { sessionGuard } from './guards/session.guard';
import { Applications } from './pages/applications/applications';
import { ApplicationsList } from './pages/applications-list/applications-list';
import { ApplicationsListCreate } from './pages/applications-list-create/applications-list-create';
import { ApplicationsListDetail } from './pages/applications-list-detail/applications-list-detail';
import { ApplicationsListEntryCreate } from './pages/applications-list-entry-create/applications-list-entry-create';
import { Login } from './pages/login/login';
import { Reports } from './pages/reports/reports';
import { ResultSelected } from './pages/result-selected/result-selected';
import { StandardApplicants } from './pages/standard-applicants/standard-applicants';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'applications-list',
    canActivate: [sessionGuard],
    children: [
      { path: '', component: ApplicationsList },
      { path: 'create', component: ApplicationsListCreate },
    ],
  },
  {
    path: 'applications-list/:id',
    canActivate: [sessionGuard],
    children: [
      { path: '', component: ApplicationsListDetail },
      { path: 'create', component: ApplicationsListEntryCreate },
    ],
  },
  {
    path: 'result-selected/:id',
    component: ResultSelected,
    canActivate: [sessionGuard],
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
