import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ReinsurerCompany } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class ReinsurersApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/reinsurers`;

  getReinsurers(search?: string, isActive?: boolean): Observable<ReinsurerCompany[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<ReinsurerCompany[]>(this.base, { params });
  }

  createReinsurer(payload: Partial<ReinsurerCompany>): Observable<ReinsurerCompany> {
    return this.http.post<ReinsurerCompany>(this.base, payload);
  }

  updateReinsurer(id: string, payload: Partial<ReinsurerCompany>): Observable<ReinsurerCompany> {
    return this.http.patch<ReinsurerCompany>(`${this.base}/${id}`, payload);
  }

  deleteReinsurer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
