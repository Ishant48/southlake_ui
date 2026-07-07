import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LineOfBusiness } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class LobsApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/lobs`;

  getLobs(search?: string, isActive?: boolean): Observable<LineOfBusiness[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<LineOfBusiness[]>(this.base, { params });
  }

  createLob(payload: Partial<LineOfBusiness>): Observable<LineOfBusiness> {
    return this.http.post<LineOfBusiness>(this.base, payload);
  }

  updateLob(id: string, payload: Partial<LineOfBusiness>): Observable<LineOfBusiness> {
    return this.http.patch<LineOfBusiness>(`${this.base}/${id}`, payload);
  }

  deleteLob(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
