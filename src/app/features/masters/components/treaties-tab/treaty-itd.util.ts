import { Treaty, TreatyState } from '../../models/master.model';
import { ItdExhibit, ItdStateOption } from '../../models/itd.model';

export function buildItdStatesList(treaty: Treaty): ItdStateOption[] {
  const states: ItdStateOption[] = (treaty.treaty_states ?? [])
    .map((s: TreatyState) => {
      const code = s.state?.state_code ?? '';
      const abbr = s.state?.state_abbr ?? String(code);
      return { code: String(code), label: String(abbr) };
    })
    .filter((s: ItdStateOption) => s.code);

  return [
    { code: 'TOTAL', label: 'TOTAL' },
    ...states.filter(s => s.code !== 'TOTAL').sort((a, b) => a.label.localeCompare(b.label)),
  ];
}

export function buildBlankExhibit(): ItdExhibit {
  return {
    uep: 0,
    loss_reserves: 0,
    loss_ibnr: 0,
    lae_reserves_dcc: 0,
    lae_ibnr_dcc: 0,
    lae_reserves_aoe: 0,
    lae_ibnr_aoe: 0,
    ulae_ibnr: 0,
  };
}

export function buildBlankExhibits(statesList: ItdStateOption[]): Record<string, ItdExhibit> {
  const blankExhibits: Record<string, ItdExhibit> = {};
  for (const st of statesList) {
    blankExhibits[st.code] = buildBlankExhibit();
  }
  return blankExhibits;
}

function getVal(val: unknown): number {
  if (Array.isArray(val)) return Number(val[val.length - 1] ?? 0);
  return Number(val ?? 0);
}

export function mergeLoadedExhibits(
  baseline: Record<string, ItdExhibit>,
  workbookExhibits: unknown[],
): Record<string, ItdExhibit> {
  const loadedExhibits: Record<string, ItdExhibit> = { ...baseline };
  for (const se of workbookExhibits as Record<string, unknown>[]) {
    const stateCode = String(se['stateCode'] ?? se['state_code']);
    if (stateCode && loadedExhibits[stateCode]) {
      loadedExhibits[stateCode] = {
        uep: getVal(se['uep']),
        loss_reserves: getVal(se['loss_reserves'] ?? se['lossReserves']),
        loss_ibnr: getVal(se['loss_ibnr'] ?? se['lossIbnr']),
        lae_reserves_dcc: getVal(se['lae_reserves_dcc'] ?? se['laeReservesDcc']),
        lae_ibnr_dcc: getVal(se['lae_ibnr_dcc'] ?? se['laeIbnrDcc']),
        lae_reserves_aoe: getVal(se['lae_reserves_aoe'] ?? se['laeReservesAoe']),
        lae_ibnr_aoe: getVal(se['lae_ibnr_aoe'] ?? se['laeIbnrAoe']),
        ulae_ibnr: getVal(se['ulae_ibnr'] ?? se['ulaeIbnr']),
      };
    }
  }
  return loadedExhibits;
}

export function buildManualItdPayload(formValue: {
  program: string;
  month_key: string;
  month_label: string;
  exhibits: Record<string, ItdExhibit>;
}): { program: string; monthKey: string; monthLabel: string; exhibits: unknown[] } {
  const exhibitsArray = Object.keys(formValue.exhibits).map(code => {
    const ex = formValue.exhibits[code];
    return {
      state_code: code,
      stateCode: code,
      uep: Number(ex.uep ?? 0),
      loss_reserves: Number(ex.loss_reserves ?? 0),
      lossReserves: Number(ex.loss_reserves ?? 0),
      loss_ibnr: Number(ex.loss_ibnr ?? 0),
      lossIbnr: Number(ex.loss_ibnr ?? 0),
      lae_reserves_dcc: Number(ex.lae_reserves_dcc ?? 0),
      laeReservesDcc: Number(ex.lae_reserves_dcc ?? 0),
      lae_ibnr_dcc: Number(ex.lae_ibnr_dcc ?? 0),
      laeIbnrDcc: Number(ex.lae_ibnr_dcc ?? 0),
      lae_reserves_aoe: Number(ex.lae_reserves_aoe ?? 0),
      laeReservesAoe: Number(ex.lae_reserves_aoe ?? 0),
      lae_ibnr_aoe: Number(ex.lae_ibnr_aoe ?? 0),
      laeIbnrAoe: Number(ex.lae_ibnr_aoe ?? 0),
      ulae_ibnr: Number(ex.ulae_ibnr ?? 0),
      ulaeIbnr: Number(ex.ulae_ibnr ?? 0),
    };
  });

  return {
    program: formValue.program,
    monthKey: formValue.month_key,
    monthLabel: formValue.month_label,
    exhibits: exhibitsArray,
  };
}

export const ITD_MONTHS_LIST = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export const ITD_YEARS_LIST = [
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  '2030',
];
