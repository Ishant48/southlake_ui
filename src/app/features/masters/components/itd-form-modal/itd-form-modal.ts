import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ItdExhibit {
  uep: number;
  loss_reserves: number;
  loss_ibnr: number;
  lae_reserves_dcc: number;
  lae_ibnr_dcc: number;
  lae_reserves_aoe: number;
  lae_ibnr_aoe: number;
  ulae_ibnr: number;
}

export interface ItdFormValue {
  program: string;
  month_key: string;
  month_label: string;
  exhibits: Record<string, ItdExhibit>;
}

export interface ItdStateOption {
  code: string;
  label: string;
}

export interface ItdMonthOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-itd-form-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './itd-form-modal.html',
  styleUrl: './itd-form-modal.scss',
})
export class ItdFormModal implements OnChanges {
  @Input() open = false;
  @Input() isEditMode = false;
  @Input() model: ItdFormValue = { program: '', month_key: '', month_label: '', exhibits: {} };
  @Input() itdStatesList: ItdStateOption[] = [];
  @Input() monthsList: ItdMonthOption[] = [];
  @Input() yearsList: string[] = [];
  @Input() initialMonth = '12';
  @Input() initialYear = '2025';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<ItdFormValue>();

  formValue: ItdFormValue = { program: '', month_key: '', month_label: '', exhibits: {} };
  selectedStateCode = 'TOTAL';
  selectedMonth = '12';
  selectedYear = '2025';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.formValue = { ...this.model, exhibits: { ...this.model.exhibits } };
    }
    if (changes['initialMonth']) {
      this.selectedMonth = this.initialMonth;
    }
    if (changes['initialYear']) {
      this.selectedYear = this.initialYear;
    }
    if (changes['itdStatesList']) {
      this.selectedStateCode = 'TOTAL';
    }
  }

  onMonthYearChange(): void {
    const monthObj = this.monthsList.find(m => m.value === this.selectedMonth);
    const monthLabel = monthObj ? monthObj.label : 'December';
    this.formValue.month_key = `${this.selectedYear}-${this.selectedMonth}`;
    this.formValue.month_label = `${monthLabel} ${this.selectedYear}`;
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.save.emit(this.formValue);
  }
}
