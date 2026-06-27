import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBalanceService, TestBalanceResponse, TestBalanceAccount } from '../../core/services/test-balance.service';

@Component({
  selector: 'app-test-balance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test-balance.component.html',
  styleUrl: './test-balance.component.scss'
})
export class TestBalanceComponent implements OnInit {
  private balanceService = inject(TestBalanceService);
  private cdr = inject(ChangeDetectorRef);

  month = 'June';
  year = 2026;
  data: TestBalanceResponse | null = null;
  isLoading = false;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  years = [2024, 2025, 2026];

  ngOnInit(): void {
    this.loadBalances();
  }

  loadBalances(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.balanceService.getTestBalance(this.month, this.year).subscribe({
      next: (res) => {
        this.data = res;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading test balance:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onPeriodChange(): void {
    this.loadBalances();
  }

  formatCurrency(val: number): string {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
}
