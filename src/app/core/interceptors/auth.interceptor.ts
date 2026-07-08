import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const publicAuthPaths = [
    '/auth/login',
    '/auth/verify-otp',
    '/auth/resolve-challenge',
    '/auth/accept-invite',
    '/auth/invite-details',
  ];
  const isPublicAuth = publicAuthPaths.some(p => req.url.includes(p));
  let cloned = req;
  const token = auth.getToken();
  const clientIp = localStorage.getItem('sl_client_ip') ?? '';
  const clientLocation = localStorage.getItem('sl_client_location') ?? '';

  const headers: Record<string, string> = {};

  if (token && !isPublicAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (clientIp) {
    headers['x-client-ip'] = clientIp;
  }
  if (clientLocation) {
    headers['x-client-location'] = clientLocation;
  }

  if (Object.keys(headers).length > 0) {
    cloned = req.clone({
      setHeaders: headers,
    });
  }

  return next(cloned).pipe(
    catchError(err => {
      if (err.status === 401 && !isPublicAuth) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
