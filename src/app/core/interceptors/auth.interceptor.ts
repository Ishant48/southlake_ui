import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const isAuthPath = req.url.includes('/auth/');
  const token = auth.getToken();

  let cloned = req;
  if (token && !isAuthPath) {
    cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(cloned).pipe(
    catchError(err => {
      if (err.status === 401 && !isAuthPath) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
