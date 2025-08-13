<<<<<<< HEAD
import { RenderMode, ServerRoute } from "@angular/ssr";

export const serverRoutes: ServerRoute[] = [
  {
    path: "**",
=======
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
>>>>>>> 38048e2 (Rebasing Code)
    renderMode: RenderMode.Prerender,
  },
];
