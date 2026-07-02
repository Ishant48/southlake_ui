import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TestBalanceService,
  TestBalanceResponse,
  TestBalanceAccount,
} from '../../core/services/test-balance.service';

@Component({
  selector: 'app-test-balance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-balance.component.html',
  styleUrl: './test-balance.component.scss',
})
export class TestBalanceComponent implements OnInit {
  private balanceService = inject(TestBalanceService);
  private cdr = inject(ChangeDetectorRef);

  month = 'June';
  year = 2026;
  activeTab: 'test-balance' | 'balance-sheet' | 'pl' = 'test-balance';
  data: TestBalanceResponse | null = null;
  balanceSheetData: any = null;
  plData: any = null;
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

  ngOnInit(): void {
    this.loadData();
  }

  selectTab(tab: 'test-balance' | 'balance-sheet' | 'pl'): void {
    this.activeTab = tab;
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    const period = `${this.month} ${this.year}`;

    if (this.activeTab === 'test-balance') {
      this.balanceService.getTestBalance(this.month, this.year).subscribe({
        next: res => {
          this.data = res;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Error loading test balance:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
    } else if (this.activeTab === 'balance-sheet') {
      this.balanceService.getBalanceSheet(period).subscribe({
        next: res => {
          this.balanceSheetData = res;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Error loading balance sheet:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
    } else if (this.activeTab === 'pl') {
      this.balanceService.getPLStatement(period).subscribe({
        next: res => {
          this.plData = res;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Error loading P&L statement:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
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
