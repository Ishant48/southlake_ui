import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReinsuranceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getWorkbooks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/workbooks`);
  }

  getPrograms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/workbooks/programs`);
  }

  getWorkbook(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/workbooks/${id}`);
  }

  deleteWorkbook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/workbooks/${id}`);
  }

  uploadWorkbook(file: File, overwrite: boolean = false, program?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (overwrite) {
      formData.append('overwrite', 'true');
    }
    if (program) {
      formData.append('program', program);
    }
    return this.http.post<any>(`${this.apiUrl}/workbooks/upload`, formData);
  }

  updateExhibit(workbookId: number, stateCode: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/workbooks/${workbookId}/exhibits/${stateCode}`, data);
  }

  updateRates(workbookId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/workbooks/${workbookId}/rates`, data);
  }

  updateCashSettlement(workbookId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/workbooks/${workbookId}/cash-settlement`, data);
  }

  getReinsuranceStatement(id: number, stateCode: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/workbooks/${id}/reinsurance-statement/${stateCode}`);
  }

  getGLJournalEntries(id: number, stateCode: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/workbooks/${id}/gl-journal-entries/${stateCode}`);
  }

  getCashSettlementCalculations(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/workbooks/${id}/cash-settlement-calculations`);
  }

  updateMappings(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/workbooks/${id}/mappings`, data);
  }

  clearDatabase(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/database/clear`, {});
  }

  seedDatabase(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/database/seed`, {});
  }

  getSeederFiles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/database/seeder-files`);
  }

  updateSeederFile(stateCode: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/database/seeder-files/${stateCode}`, data);
  }

  checkItdSeeded(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/database/check-itd-seeded`);
  }

  createManualITD(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/workbooks/manual-itd`, data);
  }
}
