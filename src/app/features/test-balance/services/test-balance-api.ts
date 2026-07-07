import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BalanceSheetResponse,
  PLStatementResponse,
  TestBalanceResponse,
} from '../models/test-balance.model';

@Injectable({ providedIn: 'root' })
export class TestBalanceApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/test-balance`;
  private reportsBase = `${environment.apiUrl}/financial-reports`;

  getTestBalance(month?: string, year?: number): Observable<TestBalanceResponse> {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    if (year) params = params.set('year', year.toString());
    return this.http.get<TestBalanceResponse>(this.base, { params });
  }

  getBalanceSheet(period: string): Observable<BalanceSheetResponse> {
    return this.http.get<BalanceSheetResponse>(`${this.reportsBase}/balance-sheet`, {
      params: { period },
    });
  }

  getPLStatement(period: string): Observable<PLStatementResponse> {
    return this.http.get<PLStatementResponse>(`${this.reportsBase}/pl`, { params: { period } });
  }
}
