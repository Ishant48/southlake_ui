import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownSearchComponent } from '../../../../shared/components/dropdown-search/dropdown-search.component';
import { ChartOfAccount } from '../../../../core/models/chart-of-account.model';
import { JournalEntryFormRow } from '../../models/journal-entry.model';

@Component({
  selector: 'app-journal-entry-form-view',
  imports: [CommonModule, FormsModule, DropdownSearchComponent],
  templateUrl: './journal-entry-form-view.html',
  styleUrl: './journal-entry-form-view.scss',
})
export class JournalEntryFormView implements OnChanges {
  @Input() entries: JournalEntryFormRow[] = [];
  @Input() jeNumber = 1;
  @Input() coaOptions: ChartOfAccount[] = [];
  @Input() coaLabelFn: (item: ChartOfAccount) => string = () => '';
  @Input() subOptionsList: { id: string; name: string }[] = [];
  @Input() subLabelFn: (item: { id: string; name: string }) => string = () => '';
  @Input() isEditingForm = false;
  @Input() submitting = false;

  @Output() cancelled = new EventEmitter<void>();
  @Output() post = new EventEmitter<JournalEntryFormRow[]>();

  localEntries: JournalEntryFormRow[] = [];
  private rowCounter = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries']) {
      this.localEntries = this.entries.map(row => ({ ...row }));
    }
  }

  private createBlankRow(values: Partial<JournalEntryFormRow> = {}): JournalEntryFormRow {
    const todayStr = new Date().toISOString().split('T')[0];
    this.rowCounter++;
    return {
      rowId: `form_row_${this.rowCounter}`,
      je_number: this.jeNumber,
      description: '',
      coa_id: '',
      sub: '',
      debit: null,
      credit: null,
      date: todayStr,
      dp: '',
      policy: '',
      memo: '',
      ...values,
    };
  }

  addRow(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const prevRow = this.localEntries[this.localEntries.length - 1];

    const newRowConfig = {
      je_number: this.jeNumber,
      description: prevRow ? prevRow.description : '',
      coa_id: '',
      sub: prevRow ? prevRow.sub : '',
      debit: null,
      credit: null,
      date: prevRow ? prevRow.date : todayStr,
      dp: prevRow ? prevRow.dp : '',
      policy: prevRow ? prevRow.policy : '',
      memo: prevRow ? prevRow.memo : '',
    };

    this.localEntries.push(this.createBlankRow(newRowConfig));
    this.localEntries.push(this.createBlankRow(newRowConfig));
  }

  copyRow(index: number): void {
    const { rowId: _rowId, ...sourceFields } = this.localEntries[index];
    const duplicate = this.createBlankRow(sourceFields);
    this.localEntries.splice(index + 1, 0, duplicate);
  }

  deleteRow(index: number): void {
    if (this.localEntries.length > 1) {
      this.localEntries.splice(index, 1);
    } else {
      this.localEntries[0] = this.createBlankRow();
    }
  }

  get totalDebits(): number {
    return this.localEntries.reduce((sum, r) => sum + Number(r.debit ?? 0), 0);
  }

  get totalCredits(): number {
    return this.localEntries.reduce((sum, r) => sum + Number(r.credit ?? 0), 0);
  }

  get difference(): number {
    return Math.abs(this.totalDebits - this.totalCredits);
  }

  get isBalanced(): boolean {
    const debits = Math.round((this.totalDebits + Number.EPSILON) * 100) / 100;
    const credits = Math.round((this.totalCredits + Number.EPSILON) * 100) / 100;
    return debits > 0 && debits === credits;
  }

  formatCurrency(value: number | string | null): string {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  submitPost(): void {
    this.post.emit(this.localEntries);
  }
}
