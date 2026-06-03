import { Routes } from '@angular/router';

export const EGGS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./eggs.component').then((m) => m.EggsComponent) },
];
