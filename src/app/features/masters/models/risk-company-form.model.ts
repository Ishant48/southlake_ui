export interface RiskCompanyFormValue {
  id?: string;
  risk_company_id: string;
  company_id: number | null;
  id_name: string;
  name: string;
  phone: string;
  is_admitted: boolean;
  state: string;
  address: string;
  zip: string;
  city: string;
  notes: string;
  is_active: boolean;
}

export function createBlankRiskCompanyForm(): RiskCompanyFormValue {
  return {
    risk_company_id: '',
    company_id: null,
    id_name: '',
    name: '',
    phone: '',
    is_admitted: true,
    state: '',
    address: '',
    zip: '',
    city: '',
    notes: '',
    is_active: true,
  };
}
