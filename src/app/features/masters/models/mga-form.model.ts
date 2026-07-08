export interface MgaFormValue {
  id?: string;
  mga_code: string;
  name: string;
  tax_payable_inhouse: boolean;
  ledger_amount: number;
  is_active: boolean;
  company_id: number | null;
  id_name: string;
  address: string;
  zip: string;
  city: string;
  state: string;
  phone: string;
  open_item: boolean;
  op_start_date: string;
  other_names: { state: string; displayName: string }[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export function createBlankMgaForm(): MgaFormValue {
  return {
    mga_code: '',
    name: '',
    tax_payable_inhouse: false,
    ledger_amount: 0,
    is_active: true,
    company_id: null,
    id_name: '',
    address: '',
    zip: '',
    city: '',
    state: '',
    phone: '',
    open_item: false,
    op_start_date: '',
    other_names: [],
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  };
}
