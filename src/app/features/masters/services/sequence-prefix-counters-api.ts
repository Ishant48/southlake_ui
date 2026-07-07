import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SequencePrefixCounter } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class SequencePrefixCountersApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/sequence-prefix-counters`;

  getSequencePrefixCounters(
    search?: string,
    isActive?: boolean,
  ): Observable<SequencePrefixCounter[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<SequencePrefixCounter[]>(this.base, { params });
  }

  createSequencePrefixCounter(
    payload: Partial<SequencePrefixCounter>,
  ): Observable<SequencePrefixCounter> {
    return this.http.post<SequencePrefixCounter>(this.base, payload);
  }

  updateSequencePrefixCounter(
    id: string,
    payload: Partial<SequencePrefixCounter>,
  ): Observable<SequencePrefixCounter> {
    return this.http.patch<SequencePrefixCounter>(`${this.base}/${id}`, payload);
  }

  deleteSequencePrefixCounter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
