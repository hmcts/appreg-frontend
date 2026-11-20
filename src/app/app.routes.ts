import { Routes } from '@angular/router';

import { HomeComponent } from '@components/home/home.component';
import { Login } from '@components/login/login.component';
import { applicationListGuard } from '@guards/application-list.guard';
import { canLeavePageGuard } from '@guards/can-leave-page.guard';
import { sessionGuard } from '@guards/session.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Home - HMCTS Applications register - GOV.UK',
    component: HomeComponent,
  },
  {
    path: 'login',
    title: 'Sign in - HMCTS Applications register - GOV.UK',
    component: Login,
  },
  {
    path: 'forbidden',
    title: 'Forbidden - HMCTS Applications register - GOV.UK',
    loadComponent: () =>
      import('@components/global-error/forbidden/forbidden.component').then(
        (m) => m.ForbiddenComponent,
      ),
  },
  {
    path: 'internal-error',
    title: 'Internal error - HMCTS Applications register - GOV.UK',
    loadComponent: () =>
      import('@components/global-error/internal-error/internal-error.component').then(
        (m) => m.InternalErrorComponent,
      ),
  },
  {
    path: 'page-not-found',
    title: 'Page not found - HMCTS Applications register - GOV.UK',
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
        title: 'Applications list - HMCTS Applications register - GOV.UK',
        loadComponent: () =>
          import('@components/applications-list/applications-list.component').then(
            (m) => m.ApplicationsList,
          ),
      },
      {
        path: 'create',
        title:
          'Create new applications list - HMCTS Applications register - GOV.UK',
        loadComponent: () =>
          import('@components/applications-list/applications-list-create/applications-list-create.component').then(
            (m) => m.ApplicationsListCreate,
          ),
      },
      {
        path: ':id/preview',
        data: { preview: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list/applications-list-preview/applications-list-preview.component').then(
            (m) => m.ApplicationsListPreview,
          ),
      },
      {
        path: ':id',
        title:
          'Applications list details - HMCTS Applications register - GOV.UK',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-detail.component').then(
            (m) => m.ApplicationsListDetail,
          ),
      },
      {
        path: ':id/delete',
        title:
          'Applications list delete - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list/applications-list-delete/applications-list-delete.component').then(
            (m) => m.ApplicationsListDeleteComponent,
          ),
      },
      {
        path: ':id/close',
        title: 'Applications list close - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-close/applications-list-close.component').then(
            (m) => m.ApplicationsListCloseComponent,
          ),
      },
      {
        path: ':id/create-entry',
        title: 'Create new entry - HMCTS Applications register - GOV.UK',
        canDeactivate: [canLeavePageGuard],
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-entry-create/applications-list-entry-create.component').then(
            (m) => m.ApplicationsListEntryCreate,
          ),
      },
      {
        path: ':id/update-entry/:entryId',
        title:
          'Applications list entry update - HMCTS Applications register - GOV.UK',
        canDeactivate: [canLeavePageGuard],
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-entry-detail/applications-list-entry-detail.component').then(
            (m) => m.ApplicationsListEntryDetail,
          ),
      },
      {
        path: ':id/:entryId/delete',
        title:
          'Applications list entry delete - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-entry-delete/applications-list-entry-delete.component').then(
            (m) => m.ApplicationsListEntryDeleteComponent,
          ),
      },
      {
        path: ':id/create-entry/change-payment-reference',
        title:
          'Entry change payment reference - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        canDeactivate: [canLeavePageGuard],
        loadComponent: () =>
          import('@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component').then(
            (m) => m.PaymentReferenceEditComponent,
          ),
      },
      {
        path: ':id/update-entry/:entryId/change-payment-reference',
        title:
          'Entry change payment reference - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        canDeactivate: [canLeavePageGuard],
        loadComponent: () =>
          import('@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component').then(
            (m) => m.PaymentReferenceEditComponent,
          ),
      },
      {
        path: ':id/bulk-upload',
        title:
          'Bulk upload applications - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        canDeactivate: [canLeavePageGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-bulk-upload/applications-list-bulk-upload.component').then(
            (m) => m.ApplicationsListBulkUpload,
          ),
      },
      {
        path: ':id/result-selected',
        title: 'Result applications - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/result-selected/result-selected.component').then(
            (m) => m.ResultSelected,
          ),
      },
      {
        path: ':id/update-officials',
        title: 'Update officials - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/update-officials/update-officials.component').then(
            (m) => m.UpdateOfficialsComponent,
          ),
      },
      {
        path: ':id/update-notes/:entryId',
        title:
          'Update application notes - HMCTS Applications register - GOV.UK',
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications/update-notes/update-notes.component').then(
            (m) => m.UpdateNotesComponent,
          ),
      },
      {
        path: ':id/update-officials/confirm',
        title: 'Update officials - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/update-officials/confirm/update-officials-confirm.component').then(
            (m) => m.UpdateOfficialsConfirmComponent,
          ),
      },
      {
        path: ':id/move',
        title: 'Move applications - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-entry-move/applications-list-entry-move.component').then(
            (m) => m.ApplicationsListEntryMoveComponent,
          ),
      },
      {
        path: ':id/move/confirm',
        title: 'Move applications - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-entry-move/move-confirm/move-confirm.component').then(
            (m) => m.MoveConfirmComponent,
          ),
      },
      {
        path: ':id/bulk-update-fee',
        title: 'Update fee details - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-detail-bulk-update-fees/applications-list-detail-bulk-update-fees.component').then(
            (m) => m.ApplicationsListDetailBulkUpdateFeesComponent,
          ),
      },
      {
        path: ':id/bulk-update-fee/confirm',
        title: 'Update fee details - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
        canActivate: [applicationListGuard],
        loadComponent: () =>
          import('@components/applications-list-detail/applications-list-detail-bulk-update-fees/fee-update-confirm/fee-update-confirm.component').then(
            (m) => m.FeeUpdateConfirmComponent,
          ),
      },
      {
        path: ':id/bulk-update-fee/change-payment-reference',
        title: 'Update fee details - HMCTS Applications register - GOV.UK',
        data: { requiresOpenList: true },
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
    title: 'Result applications - HMCTS Applications register - GOV.UK',
    loadComponent: () =>
      import('@components/applications/applications-result-selected/applications-result-selected.component').then(
        (m) => m.ApplicationsResultSelectedComponent,
      ),
    canActivate: [sessionGuard],
  },
  {
    path: 'applications',
    title: 'Applications - HMCTS Applications register - GOV.UK',
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
        title: 'Standard applicants - HMCTS Applications register - GOV.UK',
        loadComponent: () =>
          import('@components/standard-applicants/standard-applicants.component').then(
            (m) => m.StandardApplicants,
          ),
      },
      {
        path: ':id',
        title:
          'Standard applicants details - HMCTS Applications register - GOV.UK',
        loadComponent: () =>
          import('@components/standard-applicants/standard-applicants-view/standard-applicants-view.component').then(
            (m) => m.StandardApplicantsViewComponent,
          ),
      },
    ],
  },
  {
    path: 'reports',
    title: 'Reports - HMCTS Applications register - GOV.UK',
    canDeactivate: [canLeavePageGuard],
    loadComponent: () =>
      import('@components/reports/reports.component').then((m) => m.Reports),
    canActivate: [sessionGuard],
  },
  { path: '**', redirectTo: 'page-not-found' },
];
