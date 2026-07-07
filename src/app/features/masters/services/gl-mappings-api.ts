import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
<<<<<<<< HEAD:src/app/features/masters/services/gl-mappings.service.ts
import { GlMapping } from '../../../core/models/gl-mapping.model';
========
import { GlMapping } from '../models/gl-mapping.model';
>>>>>>>> a17f8f8fbcc84f348fbc8f059a23960b2fccbca0:src/app/features/masters/services/gl-mappings-api.ts
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GlMappingsApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/gl-mappings`;

  getMappings(): Observable<GlMapping[]> {
    return this.http.get<GlMapping[]>(this.base);
  }

  getMapping(id: string): Observable<GlMapping> {
    return this.http.get<GlMapping>(`${this.base}/${id}`);
  }

  createMapping(payload: Partial<GlMapping>): Observable<GlMapping> {
    return this.http.post<GlMapping>(this.base, payload);
  }

  updateMapping(id: string, payload: Partial<GlMapping>): Observable<GlMapping> {
    return this.http.patch<GlMapping>(`${this.base}/${id}`, payload);
  }

  deleteMapping(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
