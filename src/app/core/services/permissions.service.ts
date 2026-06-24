import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Module, Permission, MODULES } from '../models/permission.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private http = inject(HttpClient);

  getModules(): Observable<Module[]> {
    return of(MODULES);
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${environment.apiUrl}/permissions`);
  }
}
