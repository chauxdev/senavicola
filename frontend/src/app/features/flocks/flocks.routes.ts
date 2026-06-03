import { Routes } from '@angular/router';

export const FLOCKS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./flocks.component').then((m) => m.FlocksComponent),
  },
];
