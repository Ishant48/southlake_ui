import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role, RoleDetail, CreateRolePayload } from '../models/role.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/roles`;

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.base);
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
