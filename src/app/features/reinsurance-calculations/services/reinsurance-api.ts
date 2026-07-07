import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Workbook, WorkbookPayload } from '../models/reinsurance.model';

@Injectable({
  providedIn: 'root',
})
export class ReinsuranceApi {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getWorkbooks(): Observable<Workbook[]> {
    return this.http.get<Workbook[]>(`${this.apiUrl}/workbooks`);
  }

  getPrograms(): Observable<{ name: string }[]> {
    return this.http.get<{ name: string }[]>(`${this.apiUrl}/workbooks/programs`);
  }

  getWorkbook(id: number): Observable<Workbook> {
    return this.http.get<Workbook>(`${this.apiUrl}/workbooks/${id}`);
  }

  deleteWorkbook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/workbooks/${id}`);
  }

  uploadWorkbook(
    file: File,
    overwrite: boolean = false,
    program?: string,
  ): Observable<{ workbook: Workbook }> {
    const formData = new FormData();
    formData.append('file', file);
    if (overwrite) {
      formData.append('overwrite', 'true');
    }
    if (program) {
      formData.append('program', program);
    }
    return this.http.post<{ workbook: Workbook }>(`${this.apiUrl}/workbooks/upload`, formData);
  }

  updateExhibit(
    workbookId: number,
    stateCode: string,
    data: WorkbookPayload,
  ): Observable<Workbook> {
    return this.http.put<Workbook>(
      `${this.apiUrl}/workbooks/${workbookId}/exhibits/${stateCode}`,
      data,
    );
  }

  updateRates(workbookId: number, data: WorkbookPayload): Observable<Workbook> {
    return this.http.put<Workbook>(`${this.apiUrl}/workbooks/${workbookId}/rates`, data);
  }

  updateCashSettlement(workbookId: number, data: WorkbookPayload): Observable<Workbook> {
    return this.http.put<Workbook>(`${this.apiUrl}/workbooks/${workbookId}/cash-settlement`, data);
  }

  getReinsuranceStatement(id: number, stateCode: string): Observable<WorkbookPayload[]> {
    return this.http.get<WorkbookPayload[]>(
      `${this.apiUrl}/workbooks/${id}/reinsurance-statement/${stateCode}`,
    );
  }

  getGLJournalEntries(id: number, stateCode: string): Observable<WorkbookPayload[]> {
    return this.http.get<WorkbookPayload[]>(
      `${this.apiUrl}/workbooks/${id}/gl-journal-entries/${stateCode}`,
    );
  }

  getCashSettlementCalculations(
    id: number,
    stateCode: string = 'TOTAL',
  ): Observable<WorkbookPayload> {
    return this.http.get<WorkbookPayload>(
      `${this.apiUrl}/workbooks/${id}/cash-settlement-calculations?stateCode=${stateCode}`,
    );
  }

  updateMappings(id: number, data: WorkbookPayload): Observable<WorkbookPayload> {
    return this.http.put<WorkbookPayload>(`${this.apiUrl}/workbooks/${id}/mappings`, data);
  }

  clearDatabase(): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${this.apiUrl}/database/clear`, {});
  }

  seedDatabase(): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${this.apiUrl}/database/seed`, {});
  }

  getSeederFiles(): Observable<WorkbookPayload[]> {
    return this.http.get<WorkbookPayload[]>(`${this.apiUrl}/database/seeder-files`);
  }

  updateSeederFile(stateCode: string, data: WorkbookPayload): Observable<WorkbookPayload> {
    return this.http.put<WorkbookPayload>(
      `${this.apiUrl}/database/seeder-files/${stateCode}`,
      data,
    );
  }

  checkItdSeeded(): Observable<{ seeded: boolean }> {
    return this.http.get<{ seeded: boolean }>(`${this.apiUrl}/database/check-itd-seeded`);
  }

  createManualITD(data: WorkbookPayload): Observable<WorkbookPayload> {
    return this.http.post<WorkbookPayload>(`${this.apiUrl}/workbooks/manual-itd`, data);
  }
}
