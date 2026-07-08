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
  | 'sequence-prefix-counter'
  | 'treaty-type';

export interface SimpleFormValue {
  id?: string;
  code?: string;
  name?: string;
  is_active?: boolean;
  description?: string;
  type?: string;
  taxable?: boolean;
  priority?: number;
  fully_earned?: boolean;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  prefix?: string;
  prefix_connector?: string;
  seq_start?: number;
  next_number?: number;
  suffix?: string;
  suffix_connector?: string;
  lob_ids?: string[];
  cob_ids?: string[];
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
    prefix: '',
    prefix_connector: '',
    seq_start: 1,
    next_number: 1,
    suffix: '',
    suffix_connector: '',
    lob_ids: [],
    cob_ids: [],
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
  formSelectedLobIds: Record<string, boolean> = {};
  formSelectedCobIds: Record<string, boolean> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.formValue = { ...this.model, lob_ids: [...(this.model.lob_ids ?? [])], cob_ids: [...(this.model.cob_ids ?? [])] };
      this.formSelectedLobIds = {};
      this.formSelectedCobIds = {};
      for (const id of this.formValue.lob_ids ?? []) this.formSelectedLobIds[id] = true;
      for (const id of this.formValue.cob_ids ?? []) this.formSelectedCobIds[id] = true;
    }
  }

  onLobSelectionChange(selection: Record<string, boolean>): void {
    this.formSelectedLobIds = selection;
    this.formValue.lob_ids = Object.keys(selection).filter(k => selection[k]);
  }

  onCobSelectionChange(selection: Record<string, boolean>): void {
    this.formSelectedCobIds = selection;
    this.formValue.cob_ids = Object.keys(selection).filter(k => selection[k]);
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.save.emit(this.formValue);
  }
}
