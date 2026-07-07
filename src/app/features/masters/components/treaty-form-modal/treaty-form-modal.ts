import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DropdownSearchComponent } from '../../../../shared/components/dropdown-search/dropdown-search.component';
import {
  MgaMaster,
  ReinsurerCompany,
  RiskCompany,
  StateMaster,
  LineOfBusiness,
  CobMaster,
  SimpleMasterRecord,
} from '../../models/master.model';
import { TreatyForm, TreatyFormModel } from '../../forms/treaty-form';
import {
  TreatyFormShape,
  TreatySelectionMap,
  TreatySaveEvent,
  createBlankTreatyForm,
} from '../../models/treaty-form.model';

@Component({
  selector: 'app-treaty-form-modal',
  imports: [CommonModule, ReactiveFormsModule, DropdownSearchComponent],
  templateUrl: './treaty-form-modal.html',
  styleUrl: './treaty-form-modal.scss',
})
export class TreatyFormModal implements OnChanges {
  private treatyForm = inject(TreatyForm);

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

  form: FormGroup<TreatyFormModel> = this.treatyForm.createForm();
  formSelectedStates: TreatySelectionMap = {};
  formSelectedLobs: TreatySelectionMap = {};
  formSelectedCobs: TreatySelectionMap = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.treatyForm.patchForm(this.form, this.model);
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
    if (changes['isEditMode']) {
      if (this.isEditMode) {
        this.form.controls.treaty_code.disable();
      } else {
        this.form.controls.treaty_code.enable();
      }
    }
  }

  updateCarrierRiskCompanyId(value: unknown): void {
    const carriers = this.form.controls.carriers.value;
    if (!carriers[0]) return;
    const updated = carriers.map((carrier, i) =>
      i === 0 ? { ...carrier, risk_company_id: value == null ? '' : String(value) } : carrier,
    );
    this.form.controls.carriers.setValue(updated);
  }

  updateReinsurerReinsurerId(index: number, value: unknown): void {
    const rows = this.form.controls.reinsurers.value;
    const updated = rows.map((row, i) =>
      i === index ? { ...row, reinsurer_id: value == null ? '' : String(value) } : row,
    );
    this.form.controls.reinsurers.setValue(updated);
  }

  updateReinsurerStateId(index: number, value: unknown): void {
    const rows = this.form.controls.reinsurers.value;
    const updated = rows.map((row, i) =>
      i === index ? { ...row, state_id: value == null ? null : String(value) } : row,
    );
    this.form.controls.reinsurers.setValue(updated);
  }

  updateReinsurerBrokerId(index: number, value: unknown): void {
    const rows = this.form.controls.reinsurers.value;
    const updated = rows.map((row, i) =>
      i === index ? { ...row, broker_id: value == null ? null : String(value) } : row,
    );
    this.form.controls.reinsurers.setValue(updated);
  }

  updateReinsurerCessionPct(index: number, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const rows = this.form.controls.reinsurers.value;
    const updated = rows.map((row, i) => (i === index ? { ...row, cession_pct: value } : row));
    this.form.controls.reinsurers.setValue(updated);
  }

  addReinsurerRow(): void {
    const rows = this.form.controls.reinsurers.value;
    this.form.controls.reinsurers.setValue([...rows, { reinsurer_id: '', cession_pct: 0 }]);
  }

  removeReinsurerRow(index: number): void {
    const rows = this.form.controls.reinsurers.value;
    this.form.controls.reinsurers.setValue(rows.filter((_, i) => i !== index));
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit({
      form: this.treatyForm.toFormValue(this.form),
      selectedStates: this.formSelectedStates,
      selectedLobs: this.formSelectedLobs,
      selectedCobs: this.formSelectedCobs,
    });
  }
}
