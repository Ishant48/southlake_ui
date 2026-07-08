import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export function permissionGuard(module: string, action: string = 'view'): CanActivateFn {
  return permissionGuardAny([{ module, action }]);
}

/** Passes if the current user has ANY of the given (module, action) permissions - mirrors the sidebar's OR-of-children visibility rule. */
export function permissionGuardAny(
  checks: Array<{ module: string; action?: string }>,
): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const isAllowed = () => checks.some(c => auth.hasPermission(c.module, c.action ?? 'view'));

    return auth.fetchCurrentUser().pipe(
      map(user => {
        auth.storeSession({ user });
        if (isAllowed()) {
          return true;
        }
        return router.createUrlTree(['/dashboard']);
      }),
      catchError(() => {
        if (isAllowed()) {
          return of(true);
        }
        return of(router.createUrlTree(['/dashboard']));
      }),
    );
  };
}
