import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const publicAuthPaths = ['/auth/login', '/auth/verify-otp', '/auth/resolve-challenge', '/auth/accept-invite', '/auth/invite-details'];
  const isPublicAuth = publicAuthPaths.some(p => req.url.includes(p));
  const token = auth.getToken();

  let cloned = req;
  if (token && !isPublicAuth) {
    cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(cloned).pipe(
    catchError(err => {
      if (err.status === 401 && !isPublicAuth) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
