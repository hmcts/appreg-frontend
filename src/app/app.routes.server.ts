import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'forbidden', renderMode: RenderMode.Prerender },
  { path: 'internal-error', renderMode: RenderMode.Prerender },
  { path: 'page-not-found', renderMode: RenderMode.Prerender },
  { path: 'applications-list/:id', renderMode: RenderMode.Server },
  { path: 'applications-list/:id/update', renderMode: RenderMode.Server },
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
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
