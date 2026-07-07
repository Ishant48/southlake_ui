export interface ItdExhibit {
  uep: number;
  loss_reserves: number;
  loss_ibnr: number;
  lae_reserves_dcc: number;
  lae_ibnr_dcc: number;
  lae_reserves_aoe: number;
  lae_ibnr_aoe: number;
  ulae_ibnr: number;
}

export interface ItdRates {
  qs: number;
  cf: number;
  comm: number;
  ulae: number;
  boards_charge: number;
  loss_ratio_cap: number;
  loss_pick: number;
  lae_dcc: number;
  lae_aoe: number;
}

export interface ItdForm {
  program: string;
  month_key: string;
  month_label: string;
  rates: ItdRates;
  exhibits: Record<string, ItdExhibit>;
}

export interface ItdStateOption {
  code: string;
  label: string;
}

export interface ItdMonthOption {
  value: string;
  label: string;
}

export interface ItdFormValue {
  program: string;
  month_key: string;
  month_label: string;
  exhibits: Record<string, ItdExhibit>;
}
