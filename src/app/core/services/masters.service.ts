import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StateMaster,
  StateDocument,
  MgaMaster,
  MgaDocument,
  ReinsurerCompany,
  RiskCompany,
  RiskCompanyDocument,
  LineOfBusiness,
  CobMaster,
  Treaty,
} from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class MastersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters`;

  // Helper to build params
  private buildParams(search?: string, isActive?: boolean): HttpParams {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return params;
  }

  // ==========================================
  // STATE MASTER API
  // ==========================================
  getStates(search?: string, isActive?: boolean): Observable<StateMaster[]> {
    return this.http.get<StateMaster[]>(`${this.base}/states`, {
      params: this.buildParams(search, isActive),
    });
  }
  getState(id: string): Observable<StateMaster & { documents: StateDocument[] }> {
    return this.http.get<StateMaster & { documents: StateDocument[] }>(`${this.base}/states/${id}`);
  }
  createState(payload: Partial<StateMaster>): Observable<StateMaster> {
    return this.http.post<StateMaster>(`${this.base}/states`, payload);
  }
  updateState(id: string, payload: Partial<StateMaster>): Observable<StateMaster> {
    return this.http.patch<StateMaster>(`${this.base}/states/${id}`, payload);
  }
  deleteState(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/states/${id}`);
  }
  uploadStateDocument(stateId: string, file: File): Observable<StateDocument> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<StateDocument>(`${this.base}/states/${stateId}/documents`, formData);
  }
  deleteStateDocument(docId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/states/documents/${docId}`);
  }

  // ==========================================
  // MGA MASTER API
  // ==========================================
  getMgas(search?: string, isActive?: boolean): Observable<MgaMaster[]> {
    return this.http.get<MgaMaster[]>(`${this.base}/mgas`, {
      params: this.buildParams(search, isActive),
    });
  }
  getMga(id: string): Observable<MgaMaster & { documents: MgaDocument[] }> {
    return this.http.get<MgaMaster & { documents: MgaDocument[] }>(`${this.base}/mgas/${id}`);
  }
  createMga(payload: Partial<MgaMaster>): Observable<MgaMaster> {
    return this.http.post<MgaMaster>(`${this.base}/mgas`, payload);
  }
  updateMga(id: string, payload: Partial<MgaMaster>): Observable<MgaMaster> {
    return this.http.patch<MgaMaster>(`${this.base}/mgas/${id}`, payload);
  }
  deleteMga(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/mgas/${id}`);
  }
  uploadMgaDocument(mgaId: string, file: File): Observable<MgaDocument> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MgaDocument>(`${this.base}/mgas/${mgaId}/documents`, formData);
  }
  deleteMgaDocument(docId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/mgas/documents/${docId}`);
  }

  // ==========================================
  // REINSURER MASTER API
  // ==========================================
  getReinsurers(search?: string, isActive?: boolean): Observable<ReinsurerCompany[]> {
    return this.http.get<ReinsurerCompany[]>(`${this.base}/reinsurers`, {
      params: this.buildParams(search, isActive),
    });
  }
  createReinsurer(payload: Partial<ReinsurerCompany>): Observable<ReinsurerCompany> {
    return this.http.post<ReinsurerCompany>(`${this.base}/reinsurers`, payload);
  }
  updateReinsurer(id: string, payload: Partial<ReinsurerCompany>): Observable<ReinsurerCompany> {
    return this.http.patch<ReinsurerCompany>(`${this.base}/reinsurers/${id}`, payload);
  }
  deleteReinsurer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/reinsurers/${id}`);
  }

  // ==========================================
  // RISK COMPANY MASTER API
  // ==========================================
  getRiskCompanies(search?: string, isActive?: boolean): Observable<RiskCompany[]> {
    return this.http.get<RiskCompany[]>(`${this.base}/risk-companies`, {
      params: this.buildParams(search, isActive),
    });
  }
  getRiskCompany(id: string): Observable<RiskCompany & { documents: RiskCompanyDocument[] }> {
    return this.http.get<RiskCompany & { documents: RiskCompanyDocument[] }>(
      `${this.base}/risk-companies/${id}`,
    );
  }
  createRiskCompany(payload: Partial<RiskCompany>): Observable<RiskCompany> {
    return this.http.post<RiskCompany>(`${this.base}/risk-companies`, payload);
  }
  updateRiskCompany(id: string, payload: Partial<RiskCompany>): Observable<RiskCompany> {
    return this.http.patch<RiskCompany>(`${this.base}/risk-companies/${id}`, payload);
  }
  deleteRiskCompany(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/risk-companies/${id}`);
  }
  uploadRiskCompanyDocument(riskCompanyId: string, file: File): Observable<RiskCompanyDocument> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<RiskCompanyDocument>(
      `${this.base}/risk-companies/${riskCompanyId}/documents`,
      formData,
    );
  }
  deleteRiskCompanyDocument(docId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/risk-companies/documents/${docId}`);
  }

  // ==========================================
  // LOB MASTER API
  // ==========================================
  getLobs(search?: string, isActive?: boolean): Observable<LineOfBusiness[]> {
    return this.http.get<LineOfBusiness[]>(`${this.base}/lobs`, {
      params: this.buildParams(search, isActive),
    });
  }
  createLob(payload: Partial<LineOfBusiness>): Observable<LineOfBusiness> {
    return this.http.post<LineOfBusiness>(`${this.base}/lobs`, payload);
  }
  updateLob(id: string, payload: Partial<LineOfBusiness>): Observable<LineOfBusiness> {
    return this.http.patch<LineOfBusiness>(`${this.base}/lobs/${id}`, payload);
  }
  deleteLob(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/lobs/${id}`);
  }

  // ==========================================
  // COB MASTER API
  // ==========================================
  getCobs(search?: string, isActive?: boolean): Observable<CobMaster[]> {
    return this.http.get<CobMaster[]>(`${this.base}/cobs`, {
      params: this.buildParams(search, isActive),
    });
  }
  createCob(payload: Partial<CobMaster>): Observable<CobMaster> {
    return this.http.post<CobMaster>(`${this.base}/cobs`, payload);
  }
  updateCob(id: string, payload: Partial<CobMaster>): Observable<CobMaster> {
    return this.http.patch<CobMaster>(`${this.base}/cobs/${id}`, payload);
  }
  deleteCob(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/cobs/${id}`);
  }

  // ==========================================
  // TREATY MASTER API
  // ==========================================
  getTreaties(search?: string, isActive?: boolean): Observable<Treaty[]> {
    return this.http.get<Treaty[]>(`${this.base}/treaties`, {
      params: this.buildParams(search, isActive),
    });
  }
  getTreaty(id: string): Observable<Treaty> {
    return this.http.get<Treaty>(`${this.base}/treaties/${id}`);
  }
  createTreaty(
    payload: Partial<Treaty> & { state_ids?: string[]; lobs?: any[] },
  ): Observable<Treaty> {
    return this.http.post<Treaty>(`${this.base}/treaties`, payload);
  }
  updateTreaty(
    id: string,
    payload: Partial<Treaty> & { state_ids?: string[]; lobs?: any[] },
  ): Observable<Treaty> {
    return this.http.patch<Treaty>(`${`${this.base}/treaties`}/${id}`, payload);
  }
  deleteTreaty(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/treaties/${id}`);
  }

  addMgaToTreaties(mgaId: string, treatyIds: string[]): Observable<any> {
    return this.http.post<any>(`${this.base}/mgas/${mgaId}/add-to-treaties`, {
      treaty_ids: treatyIds,
    });
  }

  // ==========================================
  // BROKER MASTER API
  // ==========================================
  getBrokers(search?: string, isActive?: boolean): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/brokers`, {
      params: this.buildParams(search, isActive),
    });
  }
  createBroker(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/brokers`, payload);
  }
  updateBroker(id: string, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/brokers/${id}`, payload);
  }
  deleteBroker(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/brokers/${id}`);
  }

  // ==========================================
  // PRODUCT MASTER API
  // ==========================================
  getProducts(search?: string, isActive?: boolean): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/products`, {
      params: this.buildParams(search, isActive),
    });
  }
  createProduct(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/products`, payload);
  }
  updateProduct(id: string, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/products/${id}`, payload);
  }
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/products/${id}`);
  }

  // ==========================================
  // LOCKED PERIODS MASTER API
  // ==========================================
  getLockedPeriods(search?: string): Observable<any[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<any[]>(`${this.base}/locked-periods`, { params });
  }
  lockPeriod(period: string): Observable<any> {
    return this.http.post<any>(`${this.base}/locked-periods/lock`, { period });
  }
  unlockPeriod(period: string): Observable<any> {
    return this.http.post<any>(`${this.base}/locked-periods/unlock`, { period });
  }
}
