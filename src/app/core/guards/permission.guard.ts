import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export function permissionGuard(
  modules: string | string[],
  action: string = 'view',
): CanActivateFn {
  const moduleList = Array.isArray(modules) ? modules : [modules];

  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const hasAccess = () => moduleList.some(module => auth.hasPermission(module, action));

    return auth.fetchCurrentUser().pipe(
      map(user => {
        auth.storeSession({ user });
        if (hasAccess()) {
          return true;
        }
        return router.createUrlTree(['/dashboard']);
      }),
      catchError(() => {
        if (hasAccess()) {
          return of(true);
        }
        return of(router.createUrlTree(['/dashboard']));
      }),
    );
  };
}
