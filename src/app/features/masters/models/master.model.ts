export interface StateDocument {
  id: string;
  state_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  uploaded_by?: string | null;
}

export interface StateMaster {
  id: string;
  state_code: number | null;
  state_abbr: string;
  name: string;
  notes?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
  documents?: StateDocument[];
}

export interface MgaDocument {
  id: string;
  mga_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  uploaded_by?: string | null;
}

export interface MgaMaster {
  id: string;
  mga_code: string;
  name: string;
  tax_payable_inhouse: boolean;
  is_active: boolean;
  ledger_amount?: number;
  company_id?: number | string | null;
  id_name?: string | null;
  address?: string | null;
  zip?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  open_item?: boolean;
  op_start_date?: string | null;
  other_names?: { state: string; displayName: string }[] | null;
  naics_code?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_at?: string;
  updated_at?: string | null;
  documents?: MgaDocument[];
}

export interface ReinsurerCompany {
  id: string;
  reinsurer_company_id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface RiskCompanyDocument {
  id: string;
  risk_company_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  uploaded_by?: string | null;
}

export interface RiskCompany {
  id: string;
  risk_company_id: string;
  company_id: number | null;
  id_name: string | null;
  name: string;
  phone?: string | null;
  is_admitted: boolean;
  state?: string | null;
  address?: string | null;
  zip?: string | null;
  city?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string | null;
  documents?: RiskCompanyDocument[];
}

export interface LineOfBusiness {
  id: string;
  lob_code: string;
  name: string;
  is_active: boolean;
  description?: string | null;
  type?: string | null;
  taxable?: boolean;
  priority?: number;
  fully_earned?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface CobMaster {
  id: string;
  cob_code: string;
  name: string;
  is_active: boolean;
  description?: string | null;
  type?: string | null;
  taxable?: boolean;
  priority?: number;
  fully_earned?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface TreatyState {
  id: string;
  treaty_id: string;
  state_id: string;
  state?: StateMaster;
}

export interface TreatyMga {
  id: string;
  treaty_id: string;
  mga_id: string;
  mga?: MgaMaster;
}

export interface TreatyLobCob {
  id: string;
  treaty_lob_id: string;
  cob_id: string;
  cob?: CobMaster;
}

export interface TreatyLob {
  id: string;
  treaty_id: string;
  lob_id: string;
  lob?: LineOfBusiness;
  treaty_lob_cobs?: TreatyLobCob[];
}

export interface Treaty {
  id: string;
  treaty_code: string;
  name: string;
  mga_id: string;
  mga?: MgaMaster;
  reinsurer_id?: string | null;
  reinsurer?: ReinsurerCompany | null;
  risk_company_id?: string | null;
  risk_company?: RiskCompany | null;
  effective_date?: string | null;
  expiration_date?: string | null;
  qs_pct?: number | null;
  cf_pct?: number | null;
  comm_pct?: number | null;
  bb_pct?: number | null;
  ulae_pct?: number | null;
  xol_pct?: number | null;
  lr_cap_pct?: number | null;
  ibnr_pct?: number | null;
  lae_dcc_pct?: number | null;
  lae_aoe_pct?: number | null;
  carrier_retention_pct?: number | null;
  reinsurer_cession_pct?: number | null;
  is_active: boolean;
  policy_seq_prefix?: string | null;
  policy_seq_start?: number | null;
  policy_seq_next?: number | null;
  claim_seq_prefix?: string | null;
  claim_seq_start?: number | null;
  claim_seq_next?: number | null;
  ulae_type?: string | null;
  ulae_basis?: string | null;
  ulae_flat_amount?: number | null;
  created_at?: string;
  updated_at?: string | null;
  treaty_states?: TreatyState[];
  treaty_lobs?: TreatyLob[];
  treaty_mgas?: TreatyMga[];
  treaty_carriers?: TreatyCarrier[];
  treaty_reinsurers?: TreatyReinsurer[];
}

export interface TreatyCarrier {
  id?: string;
  treaty_id?: string;
  risk_company_id: string;
  risk_company?: RiskCompany;
  retention_pct: number;
  state_id?: string | null;
  broker_id?: string | null;
}

export interface TreatyReinsurer {
  id?: string;
  treaty_id?: string;
  reinsurer_id: string;
  reinsurer?: ReinsurerCompany;
  cession_pct: number;
  state_id?: string | null;
  broker_id?: string | null;
}

export interface DocumentType {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

// Brokers, Products and Locked Periods are managed through a shared generic
// masters UI whose field set varies per master type; the common known fields
// are typed explicitly and the index signature covers the remaining
// type-specific fields (e.g. broker_code, product_id, period).
export interface SimpleMasterRecord {
  id?: string;
  code?: string;
  name?: string;
  is_active?: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface SequencePrefixCounter {
  id?: string;
  code: string;
  name: string;
  prefix?: string | null;
  nextValue?: number;
  next_value?: number;
  paddingWidth?: number;
  padding_width?: number;
  description?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}
