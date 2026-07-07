// Reinsurance workbooks carry a large, evolving set of program-specific
// spreadsheet fields (exhibits, rates, mappings, cash-settlement figures).
// The known top-level shape is typed explicitly; the index signature covers
// the remaining program-specific fields rather than falling back to `any`.
//
// NOTE: the backend/consumers currently mix snake_case (line_desc_suffix,
// month_key, state_exhibits) and camelCase (lineDescSuffix, monthKey,
// stateExhibits) field names across features — both variants are declared
// here as optional to preserve existing behavior; this is not a functional
// fix for that inconsistency, only a type-safe description of it.
export interface StateExhibit {
  state_code?: string;
  stateCode?: string;
  pw?: unknown;
  uep?: unknown;
  loss_reserves?: unknown;
  lossReserves?: unknown;
  loss_ibnr?: unknown;
  lossIbnr?: unknown;
  lae_reserves_dcc?: unknown;
  laeReservesDcc?: unknown;
  lae_ibnr_dcc?: unknown;
  laeIbnrDcc?: unknown;
  lae_reserves_aoe?: unknown;
  laeReservesAoe?: unknown;
  lae_ibnr_aoe?: unknown;
  laeIbnrAoe?: unknown;
  ulae_ibnr?: unknown;
  ulaeIbnr?: unknown;
  [key: string]: unknown;
}

export interface Workbook {
  id: number;
  program?: string;
  month_key?: string;
  monthKey?: string;
  month_label?: string;
  source?: string;
  state?: string;
  name?: string;
  mga?: string;
  lob?: string;
  line_desc_suffix?: string;
  lineDescSuffix?: string;
  comp?: string;
  cc?: string;
  ext?: string;
  sub?: string;
  rates?: Record<string, unknown>;
  state_exhibits?: StateExhibit[];
  stateExhibits?: StateExhibit[];
  status?: string;
  [key: string]: unknown;
}

export type WorkbookPayload = Record<string, unknown>;
