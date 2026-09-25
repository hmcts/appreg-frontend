import { Routes } from '@angular/router';
import { Observable } from 'rxjs';

import { HomeComponent } from '@components/home/home.component';
import { Login } from '@components/login/login.component';
import type { Reports } from '@components/reports/reports.component';
import { applicationListGuard } from '@guards/application-list.guard';
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
        data: { preload: true },
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
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-detail.component').then(
            (m) => m.ApplicationsListDetail,
          ),
      },
      {
        path: ':id/delete',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list/applications-list-delete/applications-list-delete.component').then(
            (m) => m.ApplicationsListDeleteComponent,
          ),
      },
      {
        path: ':id/close',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-close/applications-list-close.component').then(
            (m) => m.ApplicationsListCloseComponent,
          ),
      },
      {
        path: ':id/create-entry',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-entry-create/applications-list-entry-create.component').then(
            (m) => m.ApplicationsListEntryCreate,
          ),
      },
      {
        path: ':id/update-entry/:entryId',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-entry-detail/applications-list-entry-detail.component').then(
            (m) => m.ApplicationsListEntryDetail,
          ),
      },
      {
        path: ':id/:entryId/delete',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-entry-delete/applications-list-entry-delete.component').then(
            (m) => m.ApplicationsListEntryDeleteComponent,
          ),
      },
      {
        path: ':id/create-entry/change-payment-reference',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component').then(
            (m) => m.PaymentReferenceEditComponent,
          ),
      },
      {
        path: ':id/update-entry/:entryId/change-payment-reference',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component').then(
            (m) => m.PaymentReferenceEditComponent,
          ),
      },
      {
        path: ':id/bulk-upload',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-bulk-upload/applications-list-bulk-upload.component').then(
            (m) => m.ApplicationsListBulkUpload,
          ),
      },
      {
        path: ':id/result-selected',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/result-selected/result-selected.component').then(
            (m) => m.ResultSelected,
          ),
      },
      {
        path: ':id/update-officials',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/update-officials/update-officials.component').then(
            (m) => m.UpdateOfficialsComponent,
          ),
      },
      {
        path: ':id/update-notes/:entryId',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications/update-notes/update-notes.component').then(
            (m) => m.UpdateNotesComponent,
          ),
      },
      {
        path: ':id/update-officials/confirm',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/update-officials/confirm/update-officials-confirm.component').then(
            (m) => m.UpdateOfficialsConfirmComponent,
          ),
      },
      {
        path: ':id/move',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-entry-move/applications-list-entry-move.component').then(
            (m) => m.ApplicationsListEntryMoveComponent,
          ),
      },
      {
        path: ':id/move/confirm',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-entry-move/move-confirm/move-confirm.component').then(
            (m) => m.MoveConfirmComponent,
          ),
      },
      {
        path: ':id/bulk-update-fee',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-detail-bulk-update-fees/applications-list-detail-bulk-update-fees.component').then(
            (m) => m.ApplicationsListDetailBulkUpdateFeesComponent,
          ),
      },
      {
        path: ':id/bulk-update-fee/confirm',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-detail-bulk-update-fees/fee-update-confirm/fee-update-confirm.component').then(
            (m) => m.FeeUpdateConfirmComponent,
          ),
      },
      {
        path: ':id/bulk-update-fee/change-payment-reference',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component').then(
            (m) => m.PaymentReferenceEditComponent,
          ),
      },
    ],
  },
  {
    path: 'applications/result-selected',
    loadComponent: () =>
      import('@components/applications/applications-result-selected/applications-result-selected.component').then(
        (m) => m.ApplicationsResultSelectedComponent,
      ),
    canActivate: [sessionGuard],
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
    canActivate: [sessionGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@components/standard-applicants/standard-applicants.component').then(
            (m) => m.StandardApplicants,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('@components/standard-applicants/standard-applicants-view/standard-applicants-view.component').then(
            (m) => m.StandardApplicantsViewComponent,
          ),
      },
    ],
  },
  {
    path: 'reports',
    canDeactivate: [
      (component: Reports): boolean | Observable<boolean> =>
        component.canLeave(),
    ],
    loadComponent: () =>
      import('@components/reports/reports.component').then((m) => m.Reports),
    canActivate: [sessionGuard],
  },
  { path: '**', redirectTo: 'page-not-found' },
];
