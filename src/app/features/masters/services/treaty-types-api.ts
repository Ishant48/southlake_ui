import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TreatyTypeMaster } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class TreatyTypesApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/treaty-types`;

  getTreatyTypes(search?: string, isActive?: boolean): Observable<TreatyTypeMaster[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<TreatyTypeMaster[]>(this.base, { params });
  }

  createTreatyType(payload: Partial<TreatyTypeMaster>): Observable<TreatyTypeMaster> {
    return this.http.post<TreatyTypeMaster>(this.base, payload);
  }

  updateTreatyType(id: string, payload: Partial<TreatyTypeMaster>): Observable<TreatyTypeMaster> {
    return this.http.patch<TreatyTypeMaster>(`${this.base}/${id}`, payload);
  }

  deleteTreatyType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
