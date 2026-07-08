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
    path: 'roles/create',
    loadComponent: () =>
      import('./roles/role-form/role-form.component').then(m => m.RoleFormComponent),
  },
  {
    path: 'roles/edit/:id',
    loadComponent: () =>
      import('./roles/role-form/role-form.component').then(m => m.RoleFormComponent),
  },
  {
    path: 'activity-logs',
    loadComponent: () =>
      import('./activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent),
  },
];
