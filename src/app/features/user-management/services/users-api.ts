import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  PaginatedResult,
  UsersFilter,
  InviteUserPayload,
  PendingInvite,
  UserStats,
} from '../models/user.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  getUsers(filter: UsersFilter = {}): Observable<PaginatedResult<User>> {
    let params = new HttpParams();
    if (filter.page != null) params = params.set('page', filter.page.toString());
    if (filter.per_page != null) params = params.set('per_page', filter.per_page.toString());
    if (filter.search) params = params.set('search', filter.search);
    if (filter.role_id) params = params.set('role_id', filter.role_id);
    if (filter.status) params = params.set('status', filter.status);
    return this.http.get<PaginatedResult<User>>(this.base, { params });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  inviteUser(payload: InviteUserPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/invite`, payload);
  }

  updateUser(id: string, payload: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}`, payload);
  }

  deactivateUser(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/${id}/deactivate`, {});
  }

  resetPassword(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/${id}/reset-password`, {});
  }

  deactivateBulk(ids: string[]): Observable<{ message: string; count: number }> {
    return this.http.post<{ message: string; count: number }>(`${this.base}/deactivate-bulk`, {
      ids,
    });
  }

  getUserPermissions(id: string): Observable<{ id: string; action: string }[]> {
    return this.http.get<{ id: string; action: string }[]>(`${this.base}/${id}/permissions`);
  }

  updateUserPermissions(id: string, permissionIds: string[]): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${id}/permissions`, {
      permissions: permissionIds,
    });
  }

  getPendingInvites(): Observable<PendingInvite[]> {
    return this.http.get<PendingInvite[]>(`${environment.apiUrl}/invites/pending`);
  }

  revokeInvite(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/invites/${id}`);
  }

  getStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.base}/stats`);
  }
}
