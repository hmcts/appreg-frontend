import { Routes } from '@angular/router';

import { HomeComponent } from '@components/home/home.component';
import { Login } from '@components/login/login.component';
import { sessionGuard } from '@guards/session.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('@components/global-error/forbidden/forbidden.component').then(
        (m) => m.ForbiddenComponent,
      ),
  },
  {
    path: 'internal-error',
    loadComponent: () =>
      import('@components/global-error/internal-error/internal-error.component').then(
        (m) => m.InternalErrorComponent,
      ),
  },
  {
    path: 'page-not-found',
    loadComponent: () =>
      import('@components/global-error/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
  {
    path: 'applications-list',
    canActivate: [sessionGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@components/applications-list/applications-list.component').then(
            (m) => m.ApplicationsList,
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('@components/applications-list/applications-list-create/applications-list-create.component').then(
            (m) => m.ApplicationsListCreate,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-detail.component').then(
            (m) => m.ApplicationsListDetail,
          ),
      },
      {
        path: ':id/delete',
        loadComponent: () =>
          import('@components/applications-list/applications-list-delete/applications-list-delete.component').then(
            (m) => m.ApplicationsListDeleteComponent,
          ),
      },
      {
        path: ':id/close',
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-close/applications-list-close.component').then(
            (m) => m.ApplicationsListCloseComponent,
          ),
      },
      {
        path: ':id/create-entry',
        loadComponent: () =>
          import('@components/applications-list-entry-create/applications-list-entry-create.component').then(
            (m) => m.ApplicationsListEntryCreate,
          ),
      },
      {
        path: ':id/update-entry/:entryId',
        loadComponent: () =>
          import('@components/applications-list-entry-detail/applications-list-entry-detail.component').then(
            (m) => m.ApplicationsListEntryDetail,
          ),
      },
      {
        path: ':id/create-entry/change-payment-reference',
        loadComponent: () =>
          import('@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component').then(
            (m) => m.PaymentReferenceEditComponent,
          ),
      },
      {
        path: ':id/update-entry/:entryId/change-payment-reference',
        loadComponent: () =>
          import('@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component').then(
            (m) => m.PaymentReferenceEditComponent,
          ),
      },
      {
        path: ':id/bulk-upload',
        loadComponent: () =>
          import('@components/applications-list-bulk-upload/applications-list-bulk-upload.component').then(
            (m) => m.ApplicationsListBulkUpload,
          ),
      },
      {
        path: ':id/result-selected',
        loadComponent: () =>
          import('@components/result-selected/result-selected.component').then(
            (m) => m.ResultSelected,
          ),
      },
      {
        path: ':id/move',
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-entry-move/applications-list-entry-move.component').then(
            (m) => m.ApplicationsListEntryMoveComponent,
          ),
      },
      {
        path: ':id/move/confirm',
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-entry-move/move-confirm/move-confirm.component').then(
            (m) => m.MoveConfirmComponent,
          ),
      },
    ],
  },
  {
    path: 'applications',
    loadComponent: () =>
      import('@components/applications/applications.component').then(
        (m) => m.Applications,
      ),
    canActivate: [sessionGuard],
  },
  {
    path: 'standard-applicants',
    loadComponent: () =>
      import('@components/standard-applicants/standard-applicants.component').then(
        (m) => m.StandardApplicants,
      ),
    canActivate: [sessionGuard],
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('@components/reports/reports.component').then((m) => m.Reports),
    canActivate: [sessionGuard],
  },
  { path: '**', redirectTo: 'page-not-found' },
];
