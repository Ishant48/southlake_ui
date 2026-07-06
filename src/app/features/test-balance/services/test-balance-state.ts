import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TestBalanceApi } from './test-balance-api';
import {
  BalanceSheetResponse,
  PLStatementResponse,
  TestBalanceResponse,
} from '../models/test-balance.model';

@Injectable({ providedIn: 'root' })
export class TestBalanceState {
  private api = inject(TestBalanceApi);

  private readonly dataSubject = new BehaviorSubject<TestBalanceResponse | null>(null);
  private readonly balanceSheetSubject = new BehaviorSubject<BalanceSheetResponse | null>(null);
  private readonly plSubject = new BehaviorSubject<PLStatementResponse | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  readonly data$ = this.dataSubject.asObservable();
  readonly balanceSheet$ = this.balanceSheetSubject.asObservable();
  readonly pl$ = this.plSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  get data(): TestBalanceResponse | null {
    return this.dataSubject.value;
  }

  loadTestBalance(month?: string, year?: number): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    this.api.getTestBalance(month, year).subscribe({
      next: res => {
        this.dataSubject.next(res);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.errorSubject.next('Error loading test balance');
        this.loadingSubject.next(false);
      },
    });
  }

  loadBalanceSheet(period: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    this.api.getBalanceSheet(period).subscribe({
      next: res => {
        this.balanceSheetSubject.next(res);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.errorSubject.next('Error loading balance sheet');
        this.loadingSubject.next(false);
      },
    });
  }

  loadPLStatement(period: string): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    this.api.getPLStatement(period).subscribe({
      next: res => {
        this.plSubject.next(res);
        this.loadingSubject.next(false);
      },
      error: () => {
        this.errorSubject.next('Error loading P&L statement');
        this.loadingSubject.next(false);
      },
    });
  }
}
