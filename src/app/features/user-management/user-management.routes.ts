import { Routes } from '@angular/router';

export const userManagementRoutes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  {
    path: 'users',
    loadComponent: () => import('./users/users.component').then(m => m.UsersComponent),
  },
  {
    path: 'roles',
    loadComponent: () => import('./roles/roles.component').then(m => m.RolesComponent),
  },
  {
    path: 'activity-logs',
    loadComponent: () =>
      import('./activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent),
  },
];
