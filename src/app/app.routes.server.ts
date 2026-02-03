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
  { path: 'applications-list/:id/update', renderMode: RenderMode.Server },
  { path: 'applications-list/:id/delete', renderMode: RenderMode.Server },
  {
    path: 'applications-list/:id/update/change-payment-reference',
    renderMode: RenderMode.Server,
  },
  { path: 'applications-list/:id/create', renderMode: RenderMode.Server },
  { path: 'applications-list/:id/bulk-upload', renderMode: RenderMode.Server },
  {
    path: 'applications-list/:id/result-selected',
    renderMode: RenderMode.Server,
  },
  { path: '**', renderMode: RenderMode.Server },
];
