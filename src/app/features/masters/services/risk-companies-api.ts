import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RiskCompany, RiskCompanyDocument } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class RiskCompaniesApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/risk-companies`;

  getRiskCompanies(search?: string, isActive?: boolean): Observable<RiskCompany[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<RiskCompany[]>(this.base, { params });
  }

  getRiskCompany(id: string): Observable<RiskCompany & { documents: RiskCompanyDocument[] }> {
    return this.http.get<RiskCompany & { documents: RiskCompanyDocument[] }>(`${this.base}/${id}`);
  }

  createRiskCompany(payload: Partial<RiskCompany>): Observable<RiskCompany> {
    return this.http.post<RiskCompany>(this.base, payload);
  }

  updateRiskCompany(id: string, payload: Partial<RiskCompany>): Observable<RiskCompany> {
    return this.http.patch<RiskCompany>(`${this.base}/${id}`, payload);
  }

  deleteRiskCompany(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadRiskCompanyDocument(
    riskCompanyId: string,
    file: File,
    documentType: string,
  ): Observable<RiskCompanyDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    return this.http.post<RiskCompanyDocument>(`${this.base}/${riskCompanyId}/documents`, formData);
  }

  deleteRiskCompanyDocument(docId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${docId}`);
  }
}
