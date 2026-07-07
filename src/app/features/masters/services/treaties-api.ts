import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Treaty } from '../models/master.model';

export type TreatyPayload = Partial<Treaty> & {
  state_ids?: string[];
  lobs?: { lob_id: string; cob_ids: string[] }[];
};

@Injectable({ providedIn: 'root' })
export class TreatiesApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/treaties`;

  getTreaties(search?: string, isActive?: boolean): Observable<Treaty[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<Treaty[]>(this.base, { params });
  }

  getTreaty(id: string): Observable<Treaty> {
    return this.http.get<Treaty>(`${this.base}/${id}`);
  }

  createTreaty(payload: TreatyPayload): Observable<Treaty> {
    return this.http.post<Treaty>(this.base, payload);
  }

  updateTreaty(id: string, payload: TreatyPayload): Observable<Treaty> {
    return this.http.patch<Treaty>(`${this.base}/${id}`, payload);
  }

  deleteTreaty(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
