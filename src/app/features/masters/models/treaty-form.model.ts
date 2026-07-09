import { Treaty, TreatyCarrier, TreatyReinsurer } from './master.model';

export type TreatyFormShape = Partial<Treaty> & {
  state_ids: string[];
  lobs: { lob_id: string; cob_ids: string[] }[];
  carriers: TreatyCarrier[];
  reinsurers: TreatyReinsurer[];
};

export type TreatySelectionMap = Record<string, boolean>;

export interface TreatyProductLobCob {
  id: string;
  name: string;
}

export interface TreatyProductOption {
  id: string;
  product_id?: string;
  name: string;
  lobs?: TreatyProductLobCob[];
  cobs?: TreatyProductLobCob[];
}

export interface TreatySaveEvent {
  form: TreatyFormShape;
  selectedStates: TreatySelectionMap;
  selectedLobs: TreatySelectionMap;
  selectedCobs: TreatySelectionMap;
}

export function createBlankTreatyForm(): TreatyFormShape {
  return {
    treaty_code: '',
    name: '',
    treaty_type: 'Quota Share',
    mga_id: '',
    reinsurer_id: null,
    risk_company_id: null,
    effective_date: '',
    expiration_date: '',
    qs_pct: 0,
    cf_pct: 0,
    comm_pct: 0,
    bb_pct: 0,
    ulae_pct: 0,
    xol_pct: 0,
    lr_cap_pct: 0,
    ibnr_pct: 0,
    carrier_retention_pct: 100,
    reinsurer_cession_pct: 0,
    is_active: true,
    is_continuous: false,
    policy_state_connector: false,
    claim_state_connector: false,
    state_ids: [],
    lobs: [],
    carriers: [],
    reinsurers: [],
  };
}
