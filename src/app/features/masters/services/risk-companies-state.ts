import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RiskCompaniesApi } from './risk-companies-api';
import { RiskCompany } from '../models/master.model';

export interface RiskCompanyPayload {
  risk_company_id: string;
  company_id: number | null;
  id_name: string | null;
  name: string;
  phone: string | null;
  is_admitted: boolean;
  state: string | null;
  address: string | null;
  zip: string | null;
  city: string | null;
  notes: string | null;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class RiskCompaniesState {
  private riskCompaniesApi = inject(RiskCompaniesApi);

  riskCompanies: RiskCompany[] = [];

  load(search?: string, active?: boolean): Observable<RiskCompany[]> {
    return this.riskCompaniesApi.getRiskCompanies(search, active).pipe(
      map(res => {
        this.riskCompanies = res;
        return res;
      }),
    );
  }

  save(
    isEditMode: boolean,
    id: string | undefined,
    payload: RiskCompanyPayload,
  ): Observable<RiskCompany> {
    return isEditMode && id
      ? this.riskCompaniesApi.updateRiskCompany(id, payload)
      : this.riskCompaniesApi.createRiskCompany(payload);
  }

  delete(id: string): Observable<void> {
    return this.riskCompaniesApi.deleteRiskCompany(id);
  }
}
