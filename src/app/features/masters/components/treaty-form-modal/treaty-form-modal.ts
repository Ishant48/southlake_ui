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
  LineOfBusiness,
  CobMaster,
  SimpleMasterRecord,
} from '../../models/master.model';

export type TreatyFormShape = Partial<Treaty> & {
  state_ids: string[];
  lobs: { lob_id: string; cob_ids: string[] }[];
  carriers: TreatyCarrier[];
  reinsurers: TreatyReinsurer[];
};

export type TreatySelectionMap = Record<string, boolean>;

export interface TreatySaveEvent {
  form: TreatyFormShape;
  selectedStates: TreatySelectionMap;
  selectedLobs: TreatySelectionMap;
  selectedCobs: TreatySelectionMap;
}

export function createBlankTreatyForm(): TreatyFormShape {
  return {
    treaty_code: '',
    name: '',
    mga_id: '',
    reinsurer_id: null,
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
    carrier_retention_pct: 100,
    reinsurer_cession_pct: 0,
    is_active: true,
    state_ids: [],
    lobs: [],
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
  @Input() selectedLobs: TreatySelectionMap = {};
  @Input() selectedCobs: TreatySelectionMap = {};

  @Input() riskCompanyOptions: RiskCompany[] = [];
  @Input() reinsurerOptions: ReinsurerCompany[] = [];
  @Input() brokerOptions: SimpleMasterRecord[] = [];
  @Input() mgaOptions: MgaMaster[] = [];
  @Input() stateOptions: StateMaster[] = [];
  @Input() lobOptions: LineOfBusiness[] = [];
  @Input() cobOptions: CobMaster[] = [];

  @Input() riskCompanyLabelFn: (item: RiskCompany) => string = () => '';
  @Input() reinsurerLabelFn: (item: ReinsurerCompany) => string = () => '';
  @Input() stateLabelFn: (item: StateMaster) => string = () => '';
  @Input() brokerLabelFn: (item: SimpleMasterRecord) => string = () => '';
  @Input() mgaLabelFn: (item: MgaMaster) => string = () => '';
  @Input() lobLabelFn: (item: LineOfBusiness) => string = () => '';
  @Input() cobLabelFn: (item: CobMaster) => string = () => '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<TreatySaveEvent>();

  formValue: TreatyFormShape = createBlankTreatyForm();
  formSelectedStates: TreatySelectionMap = {};
  formSelectedLobs: TreatySelectionMap = {};
  formSelectedCobs: TreatySelectionMap = {};

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
    if (changes['selectedLobs']) {
      this.formSelectedLobs = { ...this.selectedLobs };
    }
    if (changes['selectedCobs']) {
      this.formSelectedCobs = { ...this.selectedCobs };
    }
  }

  addReinsurerRow(): void {
    this.formValue.reinsurers = [
      ...this.formValue.reinsurers,
      { reinsurer_id: '', cession_pct: 0 },
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
      selectedLobs: this.formSelectedLobs,
      selectedCobs: this.formSelectedCobs,
    });
  }
}
