import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export function permissionGuard(module: string, action: string = 'view'): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.fetchCurrentUser().pipe(
      map(user => {
        auth.storeSession({ user });
        if (auth.hasPermission(module, action)) {
          return true;
        }
        return router.createUrlTree(['/dashboard']);
      }),
      catchError(() => {
        if (auth.hasPermission(module, action)) {
          return of(true);
        }
        return of(router.createUrlTree(['/dashboard']));
      }),
    );
  };
}
