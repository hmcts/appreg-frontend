import { Routes } from '@angular/router';

import { nationalCourtHousesResolver } from './core/resolvers/national-court-houses.resolver';
import { sessionGuard } from './guards/session.guard';
import { Applications } from './pages/applications/applications';
import { ApplicationsList } from './pages/applications-list/applications-list';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'applications-list',
    component: ApplicationsList,
    canActivate: [sessionGuard],
    resolve: {
      nationalCourtHouses: nationalCourtHousesResolver,
      // We can add more services here when needed
    },
  },
  {
    path: 'applications',
    component: Applications,
    canActivate: [sessionGuard],
  },
  { path: '**', redirectTo: 'login' },
];
