import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownSearchComponent } from '../../../../shared/components/dropdown-search/dropdown-search.component';
import { StateMaster } from '../../models/master.model';

export interface RiskCompanyFormValue {
  id?: string;
  risk_company_id: string;
  company_id: number | null;
  id_name: string;
  name: string;
  phone: string;
  is_admitted: boolean;
  state: string;
  address: string;
  zip: string;
  city: string;
  notes: string;
  is_active: boolean;
}

export function createBlankRiskCompanyForm(): RiskCompanyFormValue {
  return {
    risk_company_id: '',
    company_id: null,
    id_name: '',
    name: '',
    phone: '',
    is_admitted: true,
    state: '',
    address: '',
    zip: '',
    city: '',
    notes: '',
    is_active: true,
  };
}

@Component({
  selector: 'app-risk-company-form-modal',
  imports: [CommonModule, FormsModule, DropdownSearchComponent],
  templateUrl: './risk-company-form-modal.html',
  styleUrl: './risk-company-form-modal.scss',
})
export class RiskCompanyFormModal implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() model: RiskCompanyFormValue = createBlankRiskCompanyForm();
  @Input() isEditMode = false;
  @Input() submitting = false;
  @Input() stateOptions: StateMaster[] = [];
  @Input() stateAbbrLabelFn: (item: StateMaster) => string = item =>
    item ? `${item.state_abbr} - ${item.name}` : '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<RiskCompanyFormValue>();

  formValue: RiskCompanyFormValue = createBlankRiskCompanyForm();

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
