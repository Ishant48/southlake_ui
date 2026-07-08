import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { SessionToken } from '../models/session.model';
import { NavGroup } from '../models/nav.model';
import { environment } from '../../../environments/environment';

const SESSION_TOKEN_KEY = 'sl_session_token';
const CURRENT_USER_KEY = 'sl_current_user';

interface AuthPermission {
  action?: string;
  module_id?: string;
  [key: string]: unknown;
}

interface AuthUser {
  id?: string;
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

  constructor() {
    this.resolveClientMetadata();
  }

  private resolveClientMetadata(): void {
    const savedIp = localStorage.getItem('sl_client_ip');
    // If we have a saved IP and it is not an IPv6 address (contains no ':'), we can use it
    if (savedIp && !savedIp.includes(':')) return;

    // Fetch public IPv4 address first (ipify always resolves to IPv4)
    fetch('https://api.ipify.org?format=json')
      .then(res => {
        if (!res.ok) throw new Error('ipify request failed');
        return res.json();
      })
      .then(ipData => {
        if (ipData?.ip) {
          const ipv4 = ipData.ip;
          // Resolve location for this IPv4
          fetch(`https://ipapi.co/${ipv4}/json/`)
            .then(res => {
              if (!res.ok) throw new Error('ipapi request failed');
              return res.json();
            })
            .then(locData => {
              if (locData) {
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string from the API should also fall back to the default
                const locStr = `${locData.city || 'Delhi'}, ${locData.region ? locData.region + ', ' : ''}${locData.country_name || 'India'}`;
                localStorage.setItem('sl_client_ip', ipv4);
                localStorage.setItem('sl_client_location', locStr);
              }
            })
            .catch(err => {
              console.warn('Failed to resolve location from ipapi.co, using defaults', err);
              localStorage.setItem('sl_client_ip', ipv4);
              localStorage.setItem('sl_client_location', 'Delhi, India');
            });
        }
      })
      .catch(err => {
        console.warn(
          'Failed to fetch client IPv4 via ipify, falling back to ipapi.co directly...',
          err,
        );
        fetch('https://ipapi.co/json/')
          .then(res => res.json())
          .then(data => {
            if (data?.ip) {
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string from the API should also fall back to the default
              const locStr = `${data.city || 'Delhi'}, ${data.region ? data.region + ', ' : ''}${data.country_name || 'India'}`;
              localStorage.setItem('sl_client_ip', data.ip);
              localStorage.setItem('sl_client_location', locStr);
            }
          })
          .catch(() => {});
      });
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

    // Super Admin has full access unconditionally
    const roleName = typeof user.role === 'string' ? user.role : user.role?.name;
    if (roleName === 'superadmin' || user.is_super_admin) {
      return true;
    }

    // 1-argument signature: checks user.effective_permissions or user.permissions for a direct action name
    if (!action) {
      if (user.effective_permissions && Array.isArray(user.effective_permissions)) {
        return user.effective_permissions.includes(moduleOrPermission);
      }
      if (user.permissions && Array.isArray(user.permissions)) {
        return (
          user.permissions.includes(moduleOrPermission) ||
          user.permissions.some(
            (p: string | AuthPermission) =>
              typeof p === 'object' && p.action === moduleOrPermission,
          ) ||
          user.permissions.some(
            (p: string | AuthPermission) =>
              typeof p === 'object' && `${p.module_id}.${p.action}` === moduleOrPermission,
          )
        );
      }
      return false;
    }

    // 2-argument signature: checks user.permissions for module/action pair
    if (!user.permissions) return false;

    // If permissions is an array of strings
    if (Array.isArray(user.permissions) && typeof user.permissions[0] === 'string') {
      return (
        user.permissions.includes(`${moduleOrPermission}.${action}`) ||
        user.permissions.includes(action)
      );
    }

    // If permissions is an array of objects
    if (Array.isArray(user.permissions)) {
      const modulePerm = user.permissions.find(
        (p: string | AuthPermission) => typeof p === 'object' && p.module_id === moduleOrPermission,
      );
      if (modulePerm && typeof modulePerm === 'object') {
        return !!modulePerm[action];
      }
      // If it's flat permissions object array returned by akhil's service
      return user.permissions.some(
        (p: string | AuthPermission) =>
          typeof p === 'object' &&
          (p.action === `${moduleOrPermission}.${action}` ||
            (p.module_id === moduleOrPermission && p.action === action)),
      );
    }

    return false;
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

  getMyModules(): Observable<NavGroup[]> {
    return this.http.get<NavGroup[]>(`${environment.apiUrl}/permissions/my-modules`);
  }
}
