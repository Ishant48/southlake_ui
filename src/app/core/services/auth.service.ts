import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { SessionToken } from '../models/session.model';
import { environment } from '../../../environments/environment';

const SESSION_TOKEN_KEY = 'sl_session_token';
const CURRENT_USER_KEY = 'sl_current_user';

interface AuthPermission {
  action?: string;
  module_id?: string;
  [key: string]: unknown;
}

interface AuthUser {
  name?: string;
  email?: string;
  role?: string | { name?: string };
  is_super_admin?: boolean;
  effective_permissions?: string[];
  permissions?: (string | AuthPermission)[];
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private permissionsSignal = signal<string[]>([]);
  readonly permissions = this.permissionsSignal.asReadonly();

  constructor() {
    const user = this.getCurrentUser();
    if (user?.effective_permissions) {
      this.permissionsSignal.set(user.effective_permissions);
    }
  }

  refreshPermissions(): Observable<AuthUser> {
    return this.fetchCurrentUser().pipe(
      tap(user => {
        this.storeSession({ user });
      }),
    );
  }

  login(email: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/login`, {
      email,
      password,
    });
  }

  verifyOtp(email: string, otp: string): Observable<SessionToken> {
    return this.http.post<SessionToken>(`${environment.apiUrl}/auth/verify-otp`, { email, otp });
  }

  resolveChallenge(challengeToken: string, accept: boolean): Observable<SessionToken> {
    return this.http.post<SessionToken>(`${environment.apiUrl}/auth/resolve-challenge`, {
      challenge_token: challengeToken,
      accept,
    });
  }

  storeSession(data: { session_token?: string; user?: AuthUser }): void {
    if (data.session_token) {
      localStorage.setItem(SESSION_TOKEN_KEY, data.session_token);
    }
    if (data.user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
      const perms = data.user.effective_permissions ??
        (data.user.permissions
          ? (data.user.permissions as (string | AuthPermission)[]).map(p =>
              typeof p === 'string' ? p : p.action ?? '',
            ).filter(Boolean)
          : []);
      this.permissionsSignal.set(perms as string[]);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  hasPermission(moduleOrPermission: string, action?: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
    if (roleName === 'superadmin' || user.is_super_admin) {
      return true;
    }

    const effectivePerms = this.permissionsSignal();
    if (action) {
      return effectivePerms.includes(`${moduleOrPermission}.${action}`);
    }
    return effectivePerms.includes(moduleOrPermission);
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });
    }
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    this.router.navigate(['/auth/login']);
  }

  getInviteDetails(token: string): Observable<{ email: string; name: string }> {
    return this.http.get<{ email: string; name: string }>(
      `${environment.apiUrl}/auth/invite-details`,
      {
        params: { token },
      },
    );
  }

  acceptInvite(token: string, password: string): Observable<SessionToken> {
    return this.http.post<SessionToken>(`${environment.apiUrl}/auth/accept-invite`, {
      token,
      password,
    });
  }

  fetchCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`);
  }
}
