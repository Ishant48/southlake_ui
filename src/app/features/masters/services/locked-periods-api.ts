import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SimpleMasterRecord } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class LockedPeriodsApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/locked-periods`;

  getLockedPeriods(search?: string): Observable<SimpleMasterRecord[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<SimpleMasterRecord[]>(this.base, { params });
  }

  lockPeriod(period: string): Observable<SimpleMasterRecord> {
    return this.http.post<SimpleMasterRecord>(`${this.base}/lock`, { period });
  }

  unlockPeriod(period: string): Observable<SimpleMasterRecord> {
    return this.http.post<SimpleMasterRecord>(`${this.base}/unlock`, { period });
  }
}
