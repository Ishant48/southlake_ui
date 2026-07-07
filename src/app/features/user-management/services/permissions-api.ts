import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Module, Permission } from '../models/permission.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PermissionsApi {
  private http = inject(HttpClient);

  getModules(): Observable<Module[]> {
    return this.http.get<Module[]>(`${environment.apiUrl}/permissions/modules`);
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${environment.apiUrl}/permissions`);
  }
}
