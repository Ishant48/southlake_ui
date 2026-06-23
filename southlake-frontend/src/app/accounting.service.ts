import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface State {
  id?: string;
  name: string;
  code: string;
  premiumTax: number;
  surplusTax: number;
  stampingFee: number;
  status: string;
}

export interface Mga {
  id?: string;
  name: string;
  code: string;
  status: string;
}

export interface Lob {
  lobId: number;
  lobName: string;
  description?: string;
}

export interface AppType {
  applicationTypeId: number;
  applicationType: string;
  classId?: string;
  marketCompanyId: number;
  lobId: number;
  riskCompanyId: number;
  raterType: string;
  appTypeMultiline: string;
  fees?: string;
  forms?: string;
  manager?: string;
  underwriter?: string;
  category?: string;
  department?: string;
  active?: string;
}

export interface ChartOfAccount {
  parentCoaId: number;
  subCoaId: number;
  subCoaName: string;
  subCoaKey: string;
  nextAvailableNumber: number;
  categoryId?: number;
}

export interface SubCoa {
  categoryId: number;
  categoryName: string;
}

export interface GlMap {
  id?: string;
  glNumber: string;
  type: string;
}

export interface TreatySequence {
  sequenceNumber: number;
  description: string;
}

export interface CoaAccount {
  id?: string;
  company: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  costCenter: string;
  mgaId?: string;
  mga?: Mga;
  lobId?: number;
  lob?: Lob;
  stateId?: string;
  state?: State;
  extension: string;
  currency: string;
  status: string;
  gaapStandard: string;
  parentAccount?: string;
  accountGroup?: string;
  summaryOrActual?: string;
  earningAccount?: string;
  updatedAt?: string;
  debit?: number;
  credit?: number;
  balance?: number;
}

export interface Treaty {
  id?: string;
  name: string;
  type: string;
  carrier: string;
  limit: number;
  retentionPercentage: number;
  cessionPercentage: number;
  commissionPercentage: number;
  cededPremiumYtd: number;
  recoverables: number;
  rating: string;
  collateral: string;
  status: string;
  mgaId?: string;
  mga?: Mga;
}

export interface TreatyAppType {
  id?: string;
  treatyId: string;
  appTypeId: number;
  appType: AppType;
  cessionSharePercentage: number;
}

export interface JournalEntryLine {
  id?: string;
  coaAccountId: string;
  coaAccount?: CoaAccount;
  description: string;
  debit: number;
  credit: number;
  quantity: number;
}

export interface JournalEntry {
  id?: string;
  description: string;
  referenceNumber: string;
  entryDate: string;
  status: string;
  source: string;
  treatyId?: string;
  treaty?: Treaty;
  lines: JournalEntryLine[];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // ==========================================
  // STATES
  // ==========================================
  getStates(): Observable<State[]> {
    return this.http.get<State[]>(`${this.apiUrl}/states`);
  }

  createState(state: State): Observable<State> {
    return this.http.post<State>(`${this.apiUrl}/states`, state);
  }

  updateState(id: string, state: Partial<State>): Observable<State> {
    return this.http.put<State>(`${this.apiUrl}/states/${id}`, state);
  }

  // ==========================================
  // MGAs
  // ==========================================
  getMgas(): Observable<Mga[]> {
    return this.http.get<Mga[]>(`${this.apiUrl}/mgas`);
  }

  createMga(mga: Mga): Observable<Mga> {
    return this.http.post<Mga>(`${this.apiUrl}/mgas`, mga);
  }

  // ==========================================
  // LOBs
  // ==========================================
  getLobs(): Observable<Lob[]> {
    return this.http.get<Lob[]>(`${this.apiUrl}/lobs`);
  }

  createLob(lob: Lob): Observable<Lob> {
    return this.http.post<Lob>(`${this.apiUrl}/lobs`, lob);
  }

  updateLob(id: number, lob: Partial<Lob>): Observable<Lob> {
    return this.http.put<Lob>(`${this.apiUrl}/lobs/${id}`, lob);
  }

  deleteLob(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/lobs/${id}`);
  }

  // ==========================================
  // APP TYPES
  // ==========================================
  getAppTypes(): Observable<AppType[]> {
    return this.http.get<AppType[]>(`${this.apiUrl}/app-types`);
  }

  createAppType(appType: AppType): Observable<AppType> {
    return this.http.post<AppType>(`${this.apiUrl}/app-types`, appType);
  }

  updateAppType(id: number, appType: Partial<AppType>): Observable<AppType> {
    return this.http.put<AppType>(`${this.apiUrl}/app-types/${id}`, appType);
  }

  deleteAppType(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/app-types/${id}`);
  }

  // ==========================================
  // CHART OF ACCOUNTS MASTER (Falcon)
  // ==========================================
  getChartOfAccounts(): Observable<ChartOfAccount[]> {
    return this.http.get<ChartOfAccount[]>(`${this.apiUrl}/chart-of-accounts`);
  }

  createChartOfAccount(coa: ChartOfAccount): Observable<ChartOfAccount> {
    return this.http.post<ChartOfAccount>(`${this.apiUrl}/chart-of-accounts`, coa);
  }

  updateChartOfAccount(id: number, coa: Partial<ChartOfAccount>): Observable<ChartOfAccount> {
    return this.http.put<ChartOfAccount>(`${this.apiUrl}/chart-of-accounts/${id}`, coa);
  }

  deleteChartOfAccount(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/chart-of-accounts/${id}`);
  }

  // ==========================================
  // SUB COA / CATEGORY MASTER (Falcon)
  // ==========================================
  getSubCoas(): Observable<SubCoa[]> {
    return this.http.get<SubCoa[]>(`${this.apiUrl}/sub-coas`);
  }

  createSubCoa(subCoa: SubCoa): Observable<SubCoa> {
    return this.http.post<SubCoa>(`${this.apiUrl}/sub-coas`, subCoa);
  }

  updateSubCoa(id: number, subCoa: Partial<SubCoa>): Observable<SubCoa> {
    return this.http.put<SubCoa>(`${this.apiUrl}/sub-coas/${id}`, subCoa);
  }

  deleteSubCoa(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/sub-coas/${id}`);
  }

  // ==========================================
  // GL MAPS (Falcon)
  // ==========================================
  getGlMaps(): Observable<GlMap[]> {
    return this.http.get<GlMap[]>(`${this.apiUrl}/gl-maps`);
  }

  getTreatySequences(): Observable<TreatySequence[]> {
    return this.http.get<TreatySequence[]>(`${this.apiUrl}/treaty-sequences`);
  }

  createGlMap(glMap: GlMap): Observable<GlMap> {
    return this.http.post<GlMap>(`${this.apiUrl}/gl-maps`, glMap);
  }

  updateGlMap(id: string, glMap: Partial<GlMap>): Observable<GlMap> {
    return this.http.put<GlMap>(`${this.apiUrl}/gl-maps/${id}`, glMap);
  }

  deleteGlMap(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/gl-maps/${id}`);
  }

  // ==========================================
  // COA ACCOUNTS (Actual Ledger Accounts)
  // ==========================================
  getCoaAccounts(): Observable<CoaAccount[]> {
    return this.http.get<CoaAccount[]>(`${this.apiUrl}/coa`);
  }

  createCoaAccount(account: CoaAccount): Observable<CoaAccount> {
    return this.http.post<CoaAccount>(`${this.apiUrl}/coa`, account);
  }

  toggleCoaAccountStatus(id: string): Observable<CoaAccount> {
    return this.http.put<CoaAccount>(`${this.apiUrl}/coa/${id}/toggle`, {});
  }

  // ==========================================
  // TREATIES
  // ==========================================
  getTreaties(): Observable<Treaty[]> {
    return this.http.get<Treaty[]>(`${this.apiUrl}/treaties`);
  }

  createTreaty(treaty: Treaty): Observable<Treaty> {
    return this.http.post<Treaty>(`${this.apiUrl}/treaties`, treaty);
  }

  getTreatyCoveredAppTypes(treatyId: string): Observable<TreatyAppType[]> {
    return this.http.get<TreatyAppType[]>(`${this.apiUrl}/treaties/${treatyId}/app-types`);
  }

  updateTreatyCoveredAppTypes(treatyId: string, appTypeIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/treaties/${treatyId}/app-types`, { appTypeIds });
  }

  signTreaty(id: string): Observable<Treaty> {
    return this.http.post<Treaty>(`${this.apiUrl}/treaties/${id}/sign`, {});
  }

  // ==========================================
  // JOURNAL ENTRIES & INGESTION
  // ==========================================
  getJournalEntries(): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}/journal-entries`);
  }

  createManualJournalEntry(je: { description: string; entryDate: string; lines: any[] }): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.apiUrl}/journal-entries/manual`, je);
  }

  uploadTreatyFile(treatyId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('treatyId', treatyId);
    return this.http.post<any>(`${this.apiUrl}/journal-entries/ingest-treaty-file`, formData);
  }

  saveDraftJournalEntry(draftJe: any): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.apiUrl}/journal-entries/save-draft`, draftJe);
  }

  postJournalEntry(id: string): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(`${this.apiUrl}/journal-entries/${id}/post`, {});
  }

  resetDatabase(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-db`, {});
  }

  clearDatabase(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clear-db`, {});
  }

  getLedgerBalances(): Observable<CoaAccount[]> {
    return this.http.get<CoaAccount[]>(`${this.apiUrl}/ledger-balances`);
  }
}
