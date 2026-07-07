import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MgaMaster, MgaDocument } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class MgasApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/mgas`;

  getMgas(search?: string, isActive?: boolean): Observable<MgaMaster[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<MgaMaster[]>(this.base, { params });
  }

  getMga(id: string): Observable<MgaMaster & { documents: MgaDocument[] }> {
    return this.http.get<MgaMaster & { documents: MgaDocument[] }>(`${this.base}/${id}`);
  }

  createMga(payload: Partial<MgaMaster>): Observable<MgaMaster> {
    return this.http.post<MgaMaster>(this.base, payload);
  }

  updateMga(id: string, payload: Partial<MgaMaster>): Observable<MgaMaster> {
    return this.http.patch<MgaMaster>(`${this.base}/${id}`, payload);
  }

  deleteMga(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadMgaDocument(mgaId: string, file: File, documentType: string): Observable<MgaDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    return this.http.post<MgaDocument>(`${this.base}/${mgaId}/documents`, formData);
  }

  deleteMgaDocument(docId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${docId}`);
  }

  addMgaToTreaties(mgaId: string, treatyIds: string[]): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${this.base}/${mgaId}/add-to-treaties`, {
      treaty_ids: treatyIds,
    });
  }
}
