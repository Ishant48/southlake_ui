import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChartOfAccount,
  ChartOfAccountDocument,
} from '../../../core/models/chart-of-account.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChartOfAccountsApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/chart-of-accounts`;

  getAccounts(search?: string, isActive?: boolean): Observable<ChartOfAccount[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<ChartOfAccount[]>(this.base, { params });
  }

  getAccount(id: string): Observable<ChartOfAccount & { documents: ChartOfAccountDocument[] }> {
    return this.http.get<ChartOfAccount & { documents: ChartOfAccountDocument[] }>(
      `${this.base}/${id}`,
    );
  }

  createAccount(payload: Partial<ChartOfAccount>): Observable<ChartOfAccount> {
    return this.http.post<ChartOfAccount>(this.base, payload);
  }

  updateAccount(id: string, payload: Partial<ChartOfAccount>): Observable<ChartOfAccount> {
    return this.http.patch<ChartOfAccount>(`${this.base}/${id}`, payload);
  }

  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadDocument(coaId: string, file: File): Observable<ChartOfAccountDocument> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ChartOfAccountDocument>(`${this.base}/${coaId}/documents`, formData);
  }

  deleteDocument(docId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${docId}`);
  }
}
