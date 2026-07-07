import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownSearchComponent } from '../../../../shared/components/dropdown-search/dropdown-search.component';
import { StateMaster } from '../../models/master.model';

export interface MgaFormValue {
  id?: string;
  mga_code: string;
  name: string;
  tax_payable_inhouse: boolean;
  ledger_amount: number;
  is_active: boolean;
  company_id: number | null;
  id_name: string;
  address: string;
  zip: string;
  city: string;
  state: string;
  phone: string;
  open_item: boolean;
  op_start_date: string;
  other_names: { state: string; displayName: string }[];
  naics_code?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export function createBlankMgaForm(): MgaFormValue {
  return {
    mga_code: '',
    name: '',
    tax_payable_inhouse: false,
    ledger_amount: 0,
    is_active: true,
    company_id: null,
    id_name: '',
    address: '',
    zip: '',
    city: '',
    state: '',
    phone: '',
    open_item: false,
    op_start_date: '',
    other_names: [],
    naics_code: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  };
}

@Component({
  selector: 'app-mga-form-modal',
  imports: [CommonModule, FormsModule, DropdownSearchComponent],
  templateUrl: './mga-form-modal.html',
  styleUrl: './mga-form-modal.scss',
})
export class MgaFormModal implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() model: MgaFormValue = createBlankMgaForm();
  @Input() isEditMode = false;
  @Input() submitting = false;
  @Input() stateOptions: StateMaster[] = [];
  @Input() stateAbbrLabelFn: (item: StateMaster) => string = () => '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<MgaFormValue>();

  formValue: MgaFormValue = createBlankMgaForm();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.formValue = { ...this.model, other_names: [...(this.model.other_names ?? [])] };
    }
  }

  addOtherNameRow(): void {
    this.formValue.other_names = [...this.formValue.other_names, { state: '', displayName: '' }];
  }

  removeOtherNameRow(index: number): void {
    this.formValue.other_names = this.formValue.other_names.filter((_, i) => i !== index);
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.save.emit(this.formValue);
  }
}
