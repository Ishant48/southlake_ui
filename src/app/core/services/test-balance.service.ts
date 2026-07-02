import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TestBalanceRow {
  type: string;
  p_balance: number;
  c_balance: number;
  difference: number;
}

export interface TestBalanceAccount {
  code: string;
  name: string;
  type: string;
  status: string;
  bg_balance: number;
  current_balance: number;
  rows: TestBalanceRow[];
}

export interface TestBalanceResponse {
  month: string;
  year: number;
  status: string;
  accounts: TestBalanceAccount[];
}

@Injectable({ providedIn: 'root' })
export class TestBalanceService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/test-balance`;
  private reportsBase = `${environment.apiUrl}/financial-reports`;

  getTestBalance(month?: string, year?: number): Observable<TestBalanceResponse> {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year.toString());
    return this.http.get<TestBalanceResponse>(this.base, { params });
  }

  getBalanceSheet(period: string): Observable<any> {
    return this.http.get<any>(`${this.reportsBase}/balance-sheet`, { params: { period } });
  }

  getPLStatement(period: string): Observable<any> {
    return this.http.get<any>(`${this.reportsBase}/pl`, { params: { period } });
  }
}
