import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface GljeRow {
  desc: string;
  comp: string;
  account: string;
  cc: string;
  mga: string;
  lob: string;
  st: string;
  ext: string;
  sub: string;
  debit: number | null;
  credit: number | null;
  isNew?: boolean;
  lineDesc?: string;
}

export interface GljeRowDefaults {
  comp: string;
  cc: string;
  mga: string;
  lob: string;
  ext: string;
  sub: string;
}

@Component({
  selector: 'app-glje-tab',
  imports: [CommonModule, FormsModule],
  templateUrl: './glje-tab.html',
  styleUrl: './glje-tab.scss',
})
export class GljeTab implements OnChanges {
  @Input() rows: GljeRow[] = [];
  @Input() rowDefaults: GljeRowDefaults = { comp: '', cc: '', mga: '', lob: '', ext: '', sub: '' };
  @Input() selectedState = '';
  @Input() postingBatch = false;

  @Output() rowsChanged = new EventEmitter<GljeRow[]>();
  @Output() post = new EventEmitter<void>();
  @Output() exportCsv = new EventEmitter<void>();

  localRows: GljeRow[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows']) {
      this.localRows = this.rows.map(row => ({ ...row }));
    }
  }

  addRow(): void {
    this.localRows = [
      ...this.localRows,
      {
        desc: '',
        comp: this.rowDefaults.comp,
        account: '',
        cc: this.rowDefaults.cc,
        mga: this.rowDefaults.mga,
        lob: this.rowDefaults.lob,
        st: this.selectedState === 'TOTAL' ? '00' : this.selectedState,
        ext: this.rowDefaults.ext,
        sub: this.rowDefaults.sub,
        debit: null,
        credit: null,
        isNew: true,
      },
    ];
    this.rowsChanged.emit(this.localRows);
  }

  removeRow(index: number): void {
    this.localRows = this.localRows.filter((_, i) => i !== index);
    this.rowsChanged.emit(this.localRows);
  }

  onRowAmountChange(row: GljeRow, field: 'debit' | 'credit'): void {
    if (field === 'debit' && (row.debit ?? 0) > 0) {
      row.credit = 0;
    } else if (field === 'credit' && (row.credit ?? 0) > 0) {
      row.debit = 0;
    }
    this.rowsChanged.emit(this.localRows);
  }

  onRowChange(): void {
    this.rowsChanged.emit(this.localRows);
  }

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
