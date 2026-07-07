import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityLog, ActivityLogsFilter } from '../models/activity-log.model';
import { PaginatedResult } from '../../models/user.model';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ActivityLogsApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/activity-logs`;

  getLogs(filter: ActivityLogsFilter = {}): Observable<PaginatedResult<ActivityLog>> {
    let params = new HttpParams();
    if (filter.page != null) params = params.set('page', filter.page.toString());
    if (filter.per_page != null) params = params.set('per_page', filter.per_page.toString());
    if (filter.search) params = params.set('search', filter.search);
    if (filter.action) params = params.set('action', filter.action);
    if (filter.module_id) params = params.set('module_id', filter.module_id);
    if (filter.date_from) params = params.set('date_from', filter.date_from);
    if (filter.date_to) params = params.set('date_to', filter.date_to);
    return this.http.get<PaginatedResult<ActivityLog>>(this.base, { params });
  }

  exportLogs(filter: ActivityLogsFilter = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filter.search) params = params.set('search', filter.search);
    if (filter.action) params = params.set('action', filter.action);
    if (filter.module_id) params = params.set('module_id', filter.module_id);
    if (filter.date_from) params = params.set('date_from', filter.date_from);
    if (filter.date_to) params = params.set('date_to', filter.date_to);
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
