import { Treaty, TreatyCarrier, TreatyReinsurer } from '../../models/master.model';
import { TreatyFormShape, TreatySelectionMap } from '../../models/treaty-form.model';
import { TreatyPayload } from '../../services/treaties-api';

export interface TreatyEditState {
  form: TreatyFormShape;
  selectedStates: TreatySelectionMap;
  selectedLobs: TreatySelectionMap;
  selectedCobs: TreatySelectionMap;
}

export function buildBlankTreatyForm(mgaId?: string): TreatyEditState {
  return {
    form: {
      treaty_code: '',
      name: '',
      treaty_type: 'Quota Share',
      mga_id: mgaId ?? '',
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
      lae_dcc_pct: 0,
      lae_aoe_pct: 0,
      carrier_retention_pct: 100,
      reinsurer_cession_pct: 0,
      is_active: true,
      is_continuous: false,
      policy_state_connector: false,
      claim_state_connector: false,
      state_ids: [],
      lobs: [],
      carriers: [{ risk_company_id: '', retention_pct: 100 }],
      reinsurers: [],
    },
    selectedStates: {},
    selectedLobs: {},
    selectedCobs: {},
  };
}

export function buildTreatyEditState(treaty: Treaty): TreatyEditState {
  let carriers: TreatyCarrier[] = [];
  if (treaty.treaty_carriers && treaty.treaty_carriers.length > 0) {
    carriers = treaty.treaty_carriers.map(tc => ({
      risk_company_id: tc.risk_company_id,
      retention_pct: tc.retention_pct,
    }));
  } else if (treaty.risk_company_id) {
    carriers = [
      {
        risk_company_id: treaty.risk_company_id,
        retention_pct: treaty.carrier_retention_pct ?? 100,
      },
    ];
  } else {
    carriers = [{ risk_company_id: '', retention_pct: 100 }];
  }

  let reinsurers: TreatyReinsurer[] = [];
  if (treaty.treaty_reinsurers && treaty.treaty_reinsurers.length > 0) {
    reinsurers = treaty.treaty_reinsurers.map(tr => ({
      reinsurer_id: tr.reinsurer_id,
      cession_pct: tr.cession_pct,
      state_id: tr.state_id ?? null,
      state_ids: tr.state_ids ?? (tr.state_id ? [tr.state_id] : []),
      broker_id: tr.broker_id ?? null,
      broker_comm_type: tr.broker_comm_type ?? null,
    }));
  } else if (treaty.reinsurer_id) {
    reinsurers = [
      {
        reinsurer_id: treaty.reinsurer_id,
        cession_pct: treaty.reinsurer_cession_pct ?? 100,
        state_id: null,
        state_ids: [],
        broker_id: null,
        broker_comm_type: null,
      },
    ];
  }

  const form: TreatyFormShape = {
    id: treaty.id,
    treaty_code: treaty.treaty_code,
    name: treaty.name,
    treaty_type: treaty.treaty_type,
    mga_id: treaty.mga_id,
    reinsurer_id: treaty.reinsurer_id,
    risk_company_id: treaty.risk_company_id,
    effective_date: treaty.effective_date
      ? new Date(treaty.effective_date).toISOString().slice(0, 10)
      : '',
    expiration_date: treaty.expiration_date
      ? new Date(treaty.expiration_date).toISOString().slice(0, 10)
      : '',
    qs_pct: treaty.qs_pct,
    cf_pct: treaty.cf_pct,
    comm_pct: treaty.comm_pct,
    bb_pct: treaty.bb_pct,
    ulae_pct: treaty.ulae_pct,
    xol_pct: treaty.xol_pct,
    lr_cap_pct: treaty.lr_cap_pct,
    ibnr_pct: treaty.ibnr_pct,
    lae_dcc_pct: treaty.lae_dcc_pct,
    lae_aoe_pct: treaty.lae_aoe_pct,
    carrier_retention_pct: treaty.carrier_retention_pct,
    reinsurer_cession_pct: treaty.reinsurer_cession_pct,
    is_active: treaty.is_active,
    is_continuous: treaty.is_continuous ?? false,
    policy_state_connector: treaty.policy_state_connector ?? false,
    claim_state_connector: treaty.claim_state_connector ?? false,
    state_ids: [],
    lobs: [],
    carriers,
    reinsurers,
    products: treaty.products ?? [],
  };

  const selectedStates: TreatySelectionMap = {};
  treaty.treaty_states?.forEach(ts => {
    selectedStates[ts.state_id] = true;
  });

  const selectedLobs: TreatySelectionMap = {};
  const selectedCobs: TreatySelectionMap = {};
  treaty.treaty_lobs?.forEach(tl => {
    selectedLobs[tl.lob_id] = true;
    tl.treaty_lob_cobs?.forEach(tlc => {
      selectedCobs[tlc.cob_id] = true;
    });
  });

  return { form, selectedStates, selectedLobs, selectedCobs };
}

export function buildTreatyPayload(
  form: TreatyFormShape,
  selectedStates: TreatySelectionMap,
  selectedLobs: TreatySelectionMap,
  selectedCobs: TreatySelectionMap,
): TreatyPayload {
  const state_ids = Object.keys(selectedStates).filter(k => selectedStates[k]);
  const selectedLobIds = Object.keys(selectedLobs).filter(lobId => selectedLobs[lobId]);
  const selectedCobIds = Object.keys(selectedCobs).filter(cobId => selectedCobs[cobId]);
  const lobs = selectedLobIds.map(lobId => ({ lob_id: lobId, cob_ids: selectedCobIds }));
  const carriers = (form.carriers || []).filter(c => c.risk_company_id);
  const reinsurers = (form.reinsurers || [])
    .filter(r => r.reinsurer_id)
    .map(r => ({
      reinsurer_id: r.reinsurer_id,
      cession_pct: r.cession_pct,
      state_id: r.state_ids && r.state_ids.length > 0 ? r.state_ids[0] : null,
      state_ids: r.state_ids ?? [],
      broker_id: r.broker_id ?? null,
      broker_comm_type: r.broker_comm_type ?? null,
    }));
  const mga_ids = form.mga_id ? [form.mga_id] : [];

  return {
    ...form,
    mga_id: mga_ids[0],
    mga_ids,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
    effective_date: form.effective_date || null,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
    expiration_date: form.expiration_date || null,
    state_ids,
    lobs,
    carriers,
    reinsurers,
  } as TreatyPayload;
}
