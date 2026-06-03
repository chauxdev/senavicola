import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  {
    path: 'auth',
    canActivate: [publicGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'flocks',
        loadChildren: () => import('./features/flocks/flocks.routes').then((m) => m.FLOCKS_ROUTES),
      },
      {
        path: 'eggs',
        loadChildren: () => import('./features/eggs/eggs.routes').then((m) => m.EGGS_ROUTES),
      },
      {
        path: 'supplies',
        loadChildren: () => import('./features/supplies/supplies.routes').then((m) => m.SUPPLIES_ROUTES),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'config',
        loadChildren: () => import('./features/config/config.routes').then((m) => m.CONFIG_ROUTES),
      },
    ],
  },

  {
    path: '403',
    loadComponent: () => import('./shared/components/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  { path: '**', redirectTo: '/dashboard' },
];
