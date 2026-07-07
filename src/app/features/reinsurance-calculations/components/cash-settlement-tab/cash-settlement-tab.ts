import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CashSettlementRow {
  label?: string;
  total?: number | string;
  reins?: number | string;
  ssic?: number | string;
  reinsColor?: string;
  ssicColor?: string;
  ssicUnderline?: boolean;
  isInput?: string;
  isBold?: boolean;
  isSubtotal?: boolean;
}

export interface CashSettlement {
  beg_bal?: number;
  amt_paid?: number;
  qsPct?: number;
  reinsurerName?: string;
  rows?: CashSettlementRow[];
  [key: string]: unknown;
}

export interface CashSettlementSaveEvent {
  beg_bal: number;
  amt_paid: number;
}

@Component({
  selector: 'app-cash-settlement-tab',
  imports: [CommonModule, FormsModule],
  templateUrl: './cash-settlement-tab.html',
  styleUrl: './cash-settlement-tab.scss',
})
export class CashSettlementTab implements OnChanges {
  @Input() cashSettlement: CashSettlement | null = null;

  @Output() save = new EventEmitter<CashSettlementSaveEvent>();

  formValue: CashSettlement = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cashSettlement']) {
      this.formValue = { ...this.cashSettlement };
    }
  }

  submitSave(): void {
    this.save.emit({
      beg_bal: Number(this.formValue.beg_bal ?? 0),
      amt_paid: Number(this.formValue.amt_paid ?? 0),
    });
  }

  formatAccounting(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (isNaN(num) || Math.abs(num) < 0.001) return '-';
    const absVal = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(num));
    return num < 0 ? `(${absVal})` : absVal;
  }
}
