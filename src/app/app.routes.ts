import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard, permissionGuardAny } from './core/guards/permission.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'user-management',
        canActivate: [
          permissionGuardAny([
            { module: 'user', action: 'view' },
            { module: 'role', action: 'manage' },
            { module: 'activity_log', action: 'view' },
          ]),
        ],
        loadChildren: () =>
          import('./features/user-management/user-management.routes').then(
            m => m.userManagementRoutes,
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'chart-of-accounts',
        canActivate: [permissionGuard('chart_of_accounts')],
        loadComponent: () =>
          import('./features/chart-of-accounts/chart-of-accounts.component').then(
            m => m.ChartOfAccountsComponent,
          ),
      },
      {
        path: 'journal-entries',
        canActivate: [permissionGuard('journal_entry')],
        loadComponent: () =>
          import('./features/journal-entries/journal-entries.component').then(
            m => m.JournalEntriesComponent,
          ),
      },
      {
        path: 'test-balance',
        canActivate: [permissionGuard('test_balance')],
        loadComponent: () =>
          import('./features/test-balance/test-balance.component').then(
            m => m.TestBalanceComponent,
          ),
      },
      {
        path: 'reinsurance-calculations',
        canActivate: [permissionGuard('reinsurance')],
        loadComponent: () =>
          import('./features/reinsurance-calculations/reinsurance-calculations.component').then(
            m => m.ReinsuranceCalculationsComponent,
          ),
      },
      {
        path: 'masters',
        canActivate: [
          permissionGuardAny([
            { module: 'treaty' },
            { module: 'mga' },
            { module: 'lob' },
            { module: 'cob' },
            { module: 'state' },
            { module: 'reinsurer' },
            { module: 'risk_company' },
            { module: 'broker' },
            { module: 'product' },
            { module: 'masters_config' },
            { module: 'gl_mapping' },
          ]),
        ],
        loadChildren: () => import('./features/masters/masters.routes').then(m => m.mastersRoutes),
      },
      { path: '', redirectTo: 'user-management/users', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'auth/login' },
];
