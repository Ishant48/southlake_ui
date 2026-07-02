import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },
  { path: 'otp', loadComponent: () => import('./otp/otp.component').then(m => m.OtpComponent) },
  {
    path: 'session-conflict',
    loadComponent: () =>
      import('./session-conflict/session-conflict.component').then(m => m.SessionConflictComponent),
  },
];
