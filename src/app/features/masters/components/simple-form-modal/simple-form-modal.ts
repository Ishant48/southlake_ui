import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownSearchComponent } from '../../../../shared/components/dropdown-search/dropdown-search.component';
import { LineOfBusiness, CobMaster } from '../../models/master.model';

export type SimpleMode =
  | 'lob'
  | 'cob'
  | 'reinsurer'
  | 'broker'
  | 'product'
  | 'document-type'
  | 'sequence-prefix-counter';

export interface SimpleFormValue {
  id?: string;
  code: string;
  name: string;
  is_active: boolean;
  description: string;
  type: string;
  taxable: boolean;
  priority: number;
  fully_earned: boolean;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  lob_id?: string;
  cob_id?: string;
  prefix?: string;
  next_value?: number;
  padding_width?: number;
}

export function createBlankSimpleForm(): SimpleFormValue {
  return {
    code: '',
    name: '',
    is_active: true,
    description: '',
    type: '',
    taxable: false,
    priority: 1,
    fully_earned: false,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    lob_id: '',
    cob_id: '',
    prefix: '',
    next_value: 1,
    padding_width: 4,
  };
}

@Component({
  selector: 'app-simple-form-modal',
  imports: [CommonModule, FormsModule, DropdownSearchComponent],
  templateUrl: './simple-form-modal.html',
  styleUrl: './simple-form-modal.scss',
})
export class SimpleFormModal implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() mode: SimpleMode = 'lob';
  @Input() model: SimpleFormValue = createBlankSimpleForm();
  @Input() isEditMode = false;
  @Input() submitting = false;
  @Input() lobOptions: LineOfBusiness[] = [];
  @Input() cobOptions: CobMaster[] = [];
  @Input() lobLabelFn: (item: LineOfBusiness) => string = () => '';
  @Input() cobLabelFn: (item: CobMaster) => string = () => '';
  @Input() typeOptions: { id: string; name: string }[] = [];
  @Input() nameLabelFn: (item: { id: string; name: string }) => string = () => '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<SimpleFormValue>();

  formValue: SimpleFormValue = createBlankSimpleForm();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.formValue = { ...this.model };
    }
  }

  onProductLobCobChange(): void {
    const selectedLob = this.lobOptions.find(l => l.id === this.formValue.lob_id);
    const selectedCob = this.cobOptions.find(c => c.id === this.formValue.cob_id);

    const lobCode = selectedLob ? selectedLob.lob_code : '';
    const cobCode = selectedCob ? selectedCob.cob_code : '';

    if (lobCode && cobCode) {
      this.formValue.code = `${lobCode}-${cobCode}`;
      this.formValue.name = `${selectedLob?.name} - ${selectedCob?.name}`;
    } else {
      this.formValue.code = '';
      this.formValue.name = '';
    }
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.save.emit(this.formValue);
  }
}
