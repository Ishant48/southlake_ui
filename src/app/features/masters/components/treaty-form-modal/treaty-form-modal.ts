import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownSearchComponent } from '../../../../shared/components/dropdown-search/dropdown-search.component';
import {
  Treaty,
  TreatyCarrier,
  TreatyReinsurer,
  MgaMaster,
  ReinsurerCompany,
  RiskCompany,
  StateMaster,
  SimpleMasterRecord,
} from '../../models/master.model';

export type TreatyFormShape = Partial<Treaty> & {
  state_ids: string[];
  products: { product_id: string }[];
  carriers: TreatyCarrier[];
  reinsurers: TreatyReinsurer[];
};

export type TreatySelectionMap = Record<string, boolean>;

export interface TreatySaveEvent {
  form: TreatyFormShape;
  selectedStates: TreatySelectionMap;
  selectedProducts: TreatySelectionMap;
}

export function createBlankTreatyForm(): TreatyFormShape {
  return {
    treaty_code: '',
    name: '',
    mga_id: '',
    risk_company_id: null,
    effective_date: '',
    expiration_date: '',
    qs_pct: 0,
    cf_pct: 0,
    comm_pct: 0,
    bb_pct: 0,
    ulae_pct: 0,
    xol_pct: 0,
    lr_cap_pct: 0,
    ibnr_pct: 0,
    lae_dcc_pct: 0,
    lae_aoe_pct: 0,
    treaty_type_id: '',
    carrier_allocation_type: '',
    state_ids: [],
    products: [],
    carriers: [],
    reinsurers: [],
  };
}

@Component({
  selector: 'app-treaty-form-modal',
  imports: [CommonModule, FormsModule, DropdownSearchComponent],
  templateUrl: './treaty-form-modal.html',
  styleUrl: './treaty-form-modal.scss',
})
export class TreatyFormModal implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() model: TreatyFormShape = createBlankTreatyForm();
  @Input() isEditMode = false;
  @Input() submitting = false;
  @Input() selectedStates: TreatySelectionMap = {};
  @Input() selectedProducts: TreatySelectionMap = {};

  @Input() riskCompanyOptions: RiskCompany[] = [];
  @Input() reinsurerOptions: ReinsurerCompany[] = [];
  @Input() mgaOptions: MgaMaster[] = [];
  @Input() stateOptions: StateMaster[] = [];
  @Input() productOptions: SimpleMasterRecord[] = [];
  @Input() treatyTypeOptions: SimpleMasterRecord[] = [];

  @Input() riskCompanyLabelFn: (item: RiskCompany) => string = () => '';
  @Input() reinsurerLabelFn: (item: ReinsurerCompany) => string = () => '';
  @Input() stateLabelFn: (item: StateMaster) => string = () => '';
  @Input() mgaLabelFn: (item: MgaMaster) => string = () => '';
  @Input() productLabelFn: (item: SimpleMasterRecord) => string = () => '';
  @Input() treatyTypeLabelFn: (item: SimpleMasterRecord) => string = () => '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<TreatySaveEvent>();

  formValue: TreatyFormShape = createBlankTreatyForm();
  formSelectedStates: TreatySelectionMap = {};
  formSelectedProducts: TreatySelectionMap = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.formValue = {
        ...this.model,
        carriers: [...(this.model.carriers ?? [])],
        reinsurers: [...(this.model.reinsurers ?? [])],
      };
    }
    if (changes['selectedStates']) {
      this.formSelectedStates = { ...this.selectedStates };
    }
    if (changes['selectedProducts']) {
      this.formSelectedProducts = { ...this.selectedProducts };
    }
  }

  addReinsurerRow(): void {
    this.formValue.reinsurers = [
      ...this.formValue.reinsurers,
      { reinsurer_id: '', quota_share: 0 },
    ];
  }

  removeReinsurerRow(index: number): void {
    this.formValue.reinsurers = this.formValue.reinsurers.filter((_, i) => i !== index);
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.save.emit({
      form: this.formValue,
      selectedStates: this.formSelectedStates,
      selectedProducts: this.formSelectedProducts,
    });
  }
}
