import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CobMaster } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class CobsApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/cobs`;

  getCobs(search?: string, isActive?: boolean): Observable<CobMaster[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<CobMaster[]>(this.base, { params });
  }

  createCob(payload: Partial<CobMaster>): Observable<CobMaster> {
    return this.http.post<CobMaster>(this.base, payload);
  }

  updateCob(id: string, payload: Partial<CobMaster>): Observable<CobMaster> {
    return this.http.patch<CobMaster>(`${this.base}/${id}`, payload);
  }

  deleteCob(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
