import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'applications-list/:id', renderMode: RenderMode.Server },
  { path: 'applications-list/:id/update', renderMode: RenderMode.Server },
  { path: 'applications-list/:id/create', renderMode: RenderMode.Server },
  {
    path: 'result-selected/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
