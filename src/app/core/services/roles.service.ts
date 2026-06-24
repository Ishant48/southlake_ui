import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role, RoleDetail, CreateRolePayload } from '../models/role.model';
import { PaginatedResult } from '../models/user.model';
import { environment } from '../../../environments/environment';

export interface RolesFilter {
  page?: number;
  per_page?: number;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/roles`;

  getRoles(filter: RolesFilter = {}): Observable<PaginatedResult<Role>> {
    let params = new HttpParams();
    if (filter.page != null) params = params.set('page', filter.page.toString());
    if (filter.per_page != null) params = params.set('per_page', filter.per_page.toString());
    return this.http.get<PaginatedResult<Role>>(this.base, { params });
  }

  getRole(id: string): Observable<RoleDetail> {
    return this.http.get<RoleDetail>(`${this.base}/${id}`);
  }

  createRole(payload: CreateRolePayload): Observable<Role> {
    return this.http.post<Role>(this.base, payload);
  }

  updateRole(id: string, payload: Partial<CreateRolePayload>): Observable<Role> {
    return this.http.patch<Role>(`${this.base}/${id}`, payload);
  }

  deleteRole(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
