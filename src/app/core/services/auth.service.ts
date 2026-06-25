import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { SessionToken } from '../models/session.model';
import { environment } from '../../../environments/environment';

const SESSION_TOKEN_KEY = 'sl_session_token';
const CURRENT_USER_KEY = 'sl_current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  login(email: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/login`, { email, password });
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

  storeSession(data: { session_token?: string; user?: any }): void {
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

  getCurrentUser(): { id: string; name: string; email: string; role: any; permissions?: any[] } | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  hasPermission(module: string, action: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Super Admin has full access unconditionally
    if (user.role && (user.role === 'superadmin' || user.role.name === 'superadmin')) {
      return true;
    }
    
    if (!user.permissions) return false;
    const modulePerm = user.permissions.find((p: any) => p.module_id === module);
    return !!modulePerm && !!modulePerm[action];
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
    return this.http.get<{ email: string; name: string }>(`${environment.apiUrl}/auth/invite-details`, {
      params: { token }
    });
  }

  acceptInvite(token: string, password: string): Observable<SessionToken> {
    return this.http.post<SessionToken>(`${environment.apiUrl}/auth/accept-invite`, { token, password });
  }

  fetchCurrentUser(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/auth/me`);
  }
}
