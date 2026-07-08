import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MgaFormValue {
  id?: string;
  mga_code: string;
  name: string;
  is_active: boolean;
  ledger_amount: number;
  company_id: number | null;
  id_name: string;
  address: string;
  zip: string;
  city: string;
  state: string;
  phone: string;
  open_item: boolean;
  op_start_date: string;
}

export function createBlankMgaForm(): MgaFormValue {
  return {
    mga_code: '',
    name: '',
    is_active: true,
    ledger_amount: 0,
    company_id: null,
    id_name: '',
    address: '',
    zip: '',
    city: '',
    state: '',
    phone: '',
    open_item: false,
    op_start_date: '',
  };
}

@Component({
  selector: 'app-mga-form-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './mga-form-modal.html',
  styleUrl: './mga-form-modal.scss',
})
export class MgaFormModal implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() model: MgaFormValue = createBlankMgaForm();
  @Input() isEditMode = false;
  @Input() submitting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<MgaFormValue>();

  formValue: MgaFormValue = createBlankMgaForm();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.formValue = { ...this.model };
    }
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.save.emit(this.formValue);
  }
}
