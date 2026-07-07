export interface MastersExportData {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  filename: string;
}
