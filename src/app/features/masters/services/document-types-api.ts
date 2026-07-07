import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DocumentType } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class DocumentTypesApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/document-types`;

  getDocumentTypes(search?: string, isActive?: boolean): Observable<DocumentType[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<DocumentType[]>(this.base, { params });
  }

  createDocumentType(payload: Partial<DocumentType>): Observable<DocumentType> {
    return this.http.post<DocumentType>(this.base, payload);
  }

  updateDocumentType(id: string, payload: Partial<DocumentType>): Observable<DocumentType> {
    return this.http.patch<DocumentType>(`${this.base}/${id}`, payload);
  }

  deleteDocumentType(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
