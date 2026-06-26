import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.fetchCurrentUser().pipe(
      map(user => {
        auth.storeSession({ user });
        if (auth.hasPermission(permission)) {
          return true;
        }
        return router.createUrlTree(['/dashboard']);
      }),
      catchError(() => {
        if (auth.hasPermission(permission)) {
          return of(true);
        }
        return of(router.createUrlTree(['/dashboard']));
      })
    );
  };
}
