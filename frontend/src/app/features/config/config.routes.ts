import { Routes } from '@angular/router';

export const CONFIG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./config-home/config-home.component').then((m) => m.ConfigHomeComponent),
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'roles',
    loadComponent: () => import('./roles/roles.component').then((m) => m.RolesComponent),
  },
  {
    path: 'permissions',
    loadComponent: () => import('./permissions/permissions.component').then((m) => m.PermissionsComponent),
  },
  {
    path: 'breeds',
    loadComponent: () => import('./breeds/breeds.component').then((m) => m.BreedsComponent),
  },
  {
    path: 'barns',
    loadComponent: () => import('./barns/barns.component').then((m) => m.BarnsConfigComponent),
  },
  {
    path: 'egg-types',
    loadComponent: () => import('./egg-types/egg-types.component').then((m) => m.EggTypesComponent),
  },
  {
    path: 'measurement-units',
    loadComponent: () => import('./measurement-units/measurement-units.component').then((m) => m.MeasurementUnitsComponent),
  },
  {
    path: 'supply-categories',
    loadComponent: () => import('./supply-categories/supply-categories.component').then((m) => m.SupplyCategoriesComponent),
  },
  {
    path: 'supply-actions',
    loadComponent: () => import('./supply-actions/supply-actions.component').then((m) => m.SupplyActionsComponent),
  },
  {
    path: 'backup',
    loadComponent: () => import('./backup/backup.component').then((m) => m.BackupComponent),
  },
];
