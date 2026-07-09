import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TreatyCarrier, TreatyReinsurer } from '../models/master.model';
import { TreatyFormShape } from '../models/treaty-form.model';

@Injectable({ providedIn: 'root' })
export class TreatyForm {
  createForm(): FormGroup<TreatyFormModel> {
    return new FormGroup<TreatyFormModel>({
      id: new FormControl<string | null>(null),
      treaty_code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      treaty_type: new FormControl('Quota Share', { nonNullable: true }),
      mga_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      reinsurer_id: new FormControl<string | null>(null),
      risk_company_id: new FormControl<string | null>(null),
      effective_date: new FormControl('', { nonNullable: true }),
      expiration_date: new FormControl('', { nonNullable: true }),
      policy_seq_prefix: new FormControl('', { nonNullable: true }),
      policy_seq_start: new FormControl<number | null>(null),
      claim_seq_prefix: new FormControl('', { nonNullable: true }),
      claim_seq_start: new FormControl<number | null>(null),
      qs_pct: new FormControl(0, { nonNullable: true }),
      cf_pct: new FormControl(0, { nonNullable: true }),
      comm_pct: new FormControl(0, { nonNullable: true }),
      bb_pct: new FormControl(0, { nonNullable: true }),
      ulae_type: new FormControl('', { nonNullable: true }),
      ulae_pct: new FormControl(0, { nonNullable: true }),
      ulae_basis: new FormControl('', { nonNullable: true }),
      ulae_flat_amount: new FormControl(0, { nonNullable: true }),
      xol_pct: new FormControl(0, { nonNullable: true }),
      lr_cap_pct: new FormControl(0, { nonNullable: true }),
      ibnr_pct: new FormControl(0, { nonNullable: true }),
      lae_dcc_pct: new FormControl(0, { nonNullable: true }),
      lae_aoe_pct: new FormControl(0, { nonNullable: true }),
      carrier_retention_pct: new FormControl(100, { nonNullable: true }),
      reinsurer_cession_pct: new FormControl(0, { nonNullable: true }),
      is_active: new FormControl(true, { nonNullable: true }),
      is_continuous: new FormControl(false, { nonNullable: true }),
      policy_state_connector: new FormControl(false, { nonNullable: true }),
      claim_state_connector: new FormControl(false, { nonNullable: true }),
      state_ids: new FormControl<string[]>([], { nonNullable: true }),
      lobs: new FormControl<{ lob_id: string; cob_ids: string[] }[]>([], { nonNullable: true }),
      carriers: new FormControl<TreatyCarrier[]>([], { nonNullable: true }),
      reinsurers: new FormControl<TreatyReinsurer[]>([], { nonNullable: true }),
    });
  }

  patchForm(form: FormGroup<TreatyFormModel>, value: TreatyFormShape): void {
    form.patchValue({
      ...value,
      id: value.id ?? null,
      effective_date: value.effective_date ?? '',
      expiration_date: value.expiration_date ?? '',
      policy_seq_prefix: value.policy_seq_prefix ?? '',
      claim_seq_prefix: value.claim_seq_prefix ?? '',
      ulae_type: value.ulae_type ?? '',
      ulae_basis: value.ulae_basis ?? '',
      ulae_flat_amount: value.ulae_flat_amount ?? 0,
      qs_pct: value.qs_pct ?? 0,
      cf_pct: value.cf_pct ?? 0,
      comm_pct: value.comm_pct ?? 0,
      bb_pct: value.bb_pct ?? 0,
      ulae_pct: value.ulae_pct ?? 0,
      xol_pct: value.xol_pct ?? 0,
      lr_cap_pct: value.lr_cap_pct ?? 0,
      ibnr_pct: value.ibnr_pct ?? 0,
      lae_dcc_pct: value.lae_dcc_pct ?? 0,
      lae_aoe_pct: value.lae_aoe_pct ?? 0,
      carrier_retention_pct: value.carrier_retention_pct ?? 100,
      reinsurer_cession_pct: value.reinsurer_cession_pct ?? 0,
      treaty_type: value.treaty_type ?? 'Quota Share',
      is_continuous: value.is_continuous ?? false,
      policy_state_connector: value.policy_state_connector ?? false,
      claim_state_connector: value.claim_state_connector ?? false,
      carriers: [...(value.carriers ?? [])],
      reinsurers: [...(value.reinsurers ?? [])],
    });
  }

  toFormValue(form: FormGroup<TreatyFormModel>): TreatyFormShape {
    const raw = form.getRawValue();
    return { ...raw, id: raw.id ?? undefined };
  }
}

export interface TreatyFormModel {
  id: FormControl<string | null>;
  treaty_code: FormControl<string>;
  name: FormControl<string>;
  treaty_type: FormControl<string>;
  mga_id: FormControl<string>;
  reinsurer_id: FormControl<string | null>;
  risk_company_id: FormControl<string | null>;
  effective_date: FormControl<string>;
  expiration_date: FormControl<string>;
  policy_seq_prefix: FormControl<string>;
  policy_seq_start: FormControl<number | null>;
  claim_seq_prefix: FormControl<string>;
  claim_seq_start: FormControl<number | null>;
  qs_pct: FormControl<number>;
  cf_pct: FormControl<number>;
  comm_pct: FormControl<number>;
  bb_pct: FormControl<number>;
  ulae_type: FormControl<string>;
  ulae_pct: FormControl<number>;
  ulae_basis: FormControl<string>;
  ulae_flat_amount: FormControl<number>;
  xol_pct: FormControl<number>;
  lr_cap_pct: FormControl<number>;
  ibnr_pct: FormControl<number>;
  lae_dcc_pct: FormControl<number>;
  lae_aoe_pct: FormControl<number>;
  carrier_retention_pct: FormControl<number>;
  reinsurer_cession_pct: FormControl<number>;
  is_active: FormControl<boolean>;
  is_continuous: FormControl<boolean>;
  policy_state_connector: FormControl<boolean>;
  claim_state_connector: FormControl<boolean>;
  state_ids: FormControl<string[]>;
  lobs: FormControl<{ lob_id: string; cob_ids: string[] }[]>;
  carriers: FormControl<TreatyCarrier[]>;
  reinsurers: FormControl<TreatyReinsurer[]>;
}
