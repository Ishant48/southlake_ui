import { RiskCompany } from '../../models/master.model';
import { RiskCompanyFormValue } from '../../models/risk-company-form.model';
import { RiskCompanyPayload } from '../../services/risk-companies-state';

export function mapRiskCompanyToFormValue(rc: RiskCompany): RiskCompanyFormValue {
  return {
    id: rc.id,
    risk_company_id: rc.risk_company_id,
    company_id: rc.company_id,
    id_name: rc.id_name ?? '',
    name: rc.name,
    phone: rc.phone ?? '',
    is_admitted: rc.is_admitted,
    state: rc.state ?? '',
    address: rc.address ?? '',
    zip: rc.zip ?? '',
    city: rc.city ?? '',
    notes: rc.notes ?? '',
    is_active: rc.is_active,
  };
}

export function buildRiskCompanyPayload(form: RiskCompanyFormValue): RiskCompanyPayload {
  return {
    risk_company_id: form.risk_company_id,
    company_id: form.company_id ? Number(form.company_id) : null,
    id_name: form.id_name || null,
    name: form.name,
    phone: form.phone || null,
    is_admitted: form.is_admitted,
    state: form.state || null,
    address: form.address || null,
    zip: form.zip || null,
    city: form.city || null,
    notes: form.notes || null,
    is_active: form.is_active,
  };
}
