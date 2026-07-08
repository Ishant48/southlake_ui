import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const userManagementRoutes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  {
    path: 'users',
    canActivate: [permissionGuard('user', 'view')],
    loadComponent: () => import('./users/users.component').then(m => m.UsersComponent),
  },
  {
    path: 'roles',
    canActivate: [permissionGuard('role', 'manage')],
    loadComponent: () => import('./roles/roles.component').then(m => m.RolesComponent),
  },
  {
    path: 'activity-logs',
    canActivate: [permissionGuard('activity_log', 'view')],
    loadComponent: () =>
      import('./activity-logs/activity-logs.component').then(m => m.ActivityLogsComponent),
  },
];
