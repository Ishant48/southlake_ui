import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatementRow {
  label?: string;
  value?: number | string;
  formula?: string;
  isHeader?: boolean;
  isBold?: boolean;
  borderClass?: string;
}

@Component({
  selector: 'app-statement-tab',
  imports: [CommonModule],
  templateUrl: './statement-tab.html',
  styleUrl: './statement-tab.scss',
})
export class StatementTab {
  @Input() rows: StatementRow[] = [];

  formatCurrency(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (isNaN(num)) return '-';
    const isNegative = num < 0;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(num));
    return isNegative ? `-$${formatted}` : `$${formatted}`;
  }
}
