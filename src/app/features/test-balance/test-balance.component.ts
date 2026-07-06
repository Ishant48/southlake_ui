import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBalanceState } from './services/test-balance-state';
import {
  BalanceSheetResponse,
  PLStatementResponse,
  TestBalanceResponse,
} from './models/test-balance.model';

@Component({
  selector: 'app-test-balance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-balance.component.html',
  styleUrl: './test-balance.component.scss',
})
export class TestBalanceComponent implements OnInit {
  private state = inject(TestBalanceState);

  month = 'June';
  year = 2026;
  activeTab: 'test-balance' | 'balance-sheet' | 'pl' = 'test-balance';
  data: TestBalanceResponse | null = null;
  balanceSheetData: BalanceSheetResponse | null = null;
  plData: PLStatementResponse | null = null;
  isLoading = false;

  months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  years = [2024, 2025, 2026];

  constructor() {
    this.state.data$.pipe(takeUntilDestroyed()).subscribe(data => (this.data = data));
    this.state.balanceSheet$
      .pipe(takeUntilDestroyed())
      .subscribe(data => (this.balanceSheetData = data));
    this.state.pl$.pipe(takeUntilDestroyed()).subscribe(data => (this.plData = data));
    this.state.loading$.pipe(takeUntilDestroyed()).subscribe(loading => (this.isLoading = loading));
  }

  ngOnInit(): void {
    this.loadData();
  }

  selectTab(tab: 'test-balance' | 'balance-sheet' | 'pl'): void {
    this.activeTab = tab;
    this.loadData();
  }

  loadData(): void {
    const period = `${this.month} ${this.year}`;

    if (this.activeTab === 'test-balance') {
      this.state.loadTestBalance(this.month, this.year);
    } else if (this.activeTab === 'balance-sheet') {
      this.state.loadBalanceSheet(period);
    } else if (this.activeTab === 'pl') {
      this.state.loadPLStatement(period);
    }
  }

  onPeriodChange(): void {
    this.loadData();
  }

  formatCurrency(val: number): string {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absVal);
    return isNegative ? `-$${formatted}` : `$${formatted}`;
  }

  getDifferenceSum(type: string): number {
    if (!this.data) return 0;
    let sum = 0;
    for (const acc of this.data.accounts) {
      const row = acc.rows.find(r => r.type === type);
      if (row) {
        sum += row.difference;
      }
    }
    return sum;
  }

  abs(val: number): number {
    return Math.abs(val);
  }
}
