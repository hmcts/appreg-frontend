import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    path: 'login',
    renderMode: RenderMode.Server,
  },
  { path: 'forbidden', renderMode: RenderMode.Server },
  { path: 'internal-error', renderMode: RenderMode.Server },
  { path: 'page-not-found', renderMode: RenderMode.Server },
  { path: 'applications-list/:id', renderMode: RenderMode.Server },
  { path: 'applications-list/:id/delete', renderMode: RenderMode.Server },
  { path: 'applications-list/:id/create-entry', renderMode: RenderMode.Server },
  {
    path: 'applications-list/:id/update-entry/:entryId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'applications-list/:id/create-entry/change-payment-reference',
    renderMode: RenderMode.Server,
  },
  {
    path: 'applications-list/:id/update-entry/:entryId/change-payment-reference',
    renderMode: RenderMode.Server,
  },
  { path: 'applications-list/:id/bulk-upload', renderMode: RenderMode.Server },
  {
    path: 'applications-list/:id/result-selected',
    renderMode: RenderMode.Server,
  },
  { path: '**', renderMode: RenderMode.Server },
];
