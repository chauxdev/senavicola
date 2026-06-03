import { Routes } from '@angular/router';

export const SUPPLIES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./supplies.component').then((m) => m.SuppliesComponent) },
];
