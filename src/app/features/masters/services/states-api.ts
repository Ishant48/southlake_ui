import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StateMaster, StateDocument } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class StatesApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/states`;

  getStates(search?: string, isActive?: boolean): Observable<StateMaster[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<StateMaster[]>(this.base, { params });
  }

  getState(id: string): Observable<StateMaster & { documents: StateDocument[] }> {
    return this.http.get<StateMaster & { documents: StateDocument[] }>(`${this.base}/${id}`);
  }

  createState(payload: Partial<StateMaster>): Observable<StateMaster> {
    return this.http.post<StateMaster>(this.base, payload);
  }

  updateState(id: string, payload: Partial<StateMaster>): Observable<StateMaster> {
    return this.http.patch<StateMaster>(`${this.base}/${id}`, payload);
  }

  deleteState(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadStateDocument(
    stateId: string,
    file: File,
    documentType: string,
  ): Observable<StateDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    return this.http.post<StateDocument>(`${this.base}/${stateId}/documents`, formData);
  }

  deleteStateDocument(docId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${docId}`);
  }
}
