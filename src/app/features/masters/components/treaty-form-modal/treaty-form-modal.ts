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
  TreatyTypeMaster,
  TreatyReinsurer,
} from '../../models/master.model';
import { TreatyForm, TreatyFormModel } from '../../forms/treaty-form';
import {
  TreatyFormShape,
  TreatySelectionMap,
  TreatySaveEvent,
  createBlankTreatyForm,
} from '../../models/treaty-form.model';

type ReinsurerOrRiskCompany = ReinsurerCompany | RiskCompany;

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
  @Input() isViewMode = false;
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
  @Input() treatyTypeOptions: TreatyTypeMaster[] = [];

  @Input() riskCompanyLabelFn: (item: RiskCompany) => string = () => '';
  @Input() reinsurerLabelFn: (item: ReinsurerCompany) => string = () => '';
  @Input() stateLabelFn: (item: StateMaster) => string = () => '';
  @Input() brokerLabelFn: (item: SimpleMasterRecord) => string = () => '';
  @Input() mgaLabelFn: (item: MgaMaster) => string = () => '';
  @Input() lobLabelFn: (item: LineOfBusiness) => string = () => '';
  @Input() cobLabelFn: (item: CobMaster) => string = () => '';

  treatyTypeLabelFn = (item: TreatyTypeMaster): string => {
    return item ? `${item.name} (${item.type_code})` : '';
  };

  reinsurerOrRiskCompanyLabelFn = (item: ReinsurerOrRiskCompany): string => {
    if (!item) return '';
    if ('reinsurer_company_id' in item) {
      return `${item.name} (${item.reinsurer_company_id}) [Reinsurer]`;
    }
    if ('risk_company_id' in item) {
      return `${item.name} (${item.risk_company_id}) [Carrier]`;
    }
    return '';
  };

  get combinedReinsurerAndRiskCompanyOptions(): ReinsurerOrRiskCompany[] {
    const reinsurers = this.reinsurerOptions || [];
    const riskCos = this.riskCompanyOptions || [];
    return [...reinsurers, ...riskCos];
  }

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<TreatySaveEvent>();

  form: FormGroup<TreatyFormModel> = this.treatyForm.createForm();
  formSelectedStates: TreatySelectionMap = {};
  formSelectedLobs: TreatySelectionMap = {};
  formSelectedCobs: TreatySelectionMap = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.treatyForm.patchForm(this.form, this.model);
      this.onContinuousChange(this.form.controls.is_continuous.value);
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
    if (changes['isViewMode']) {
      if (this.isViewMode) {
        this.form.disable();
      }
    }
    if (changes['isEditMode'] && !this.isViewMode) {
      if (this.isEditMode) {
        this.form.controls.treaty_code.disable();
      } else {
        this.form.controls.treaty_code.enable();
      }
    }
  }

  onContinuousChange(checked: boolean): void {
    this.form.controls.is_continuous.setValue(checked);
    if (checked) {
      this.form.controls.expiration_date.setValue('');
      this.form.controls.expiration_date.disable();
    } else {
      this.form.controls.expiration_date.enable();
    }
  }

  get computedCarrierRetentionPct(): number {
    const sum = this.form.controls.reinsurers.value.reduce(
      (acc, r) => acc + (r.cession_pct || 0),
      0,
    );
    return Math.max(0, 100 - sum);
  }

  get selectedCarrierIds(): string[] {
    return this.form.controls.carriers.value.map(c => c.risk_company_id);
  }

  get selectedCarrierValuesMap(): TreatySelectionMap {
    const map: TreatySelectionMap = {};
    this.selectedCarrierIds.forEach(id => {
      map[id] = true;
    });
    return map;
  }

  onCarrierSelectedValuesChange(values: TreatySelectionMap): void {
    const ids = Object.keys(values).filter(id => values[id]);
    this.updateSelectedCarriers(ids);
  }

  updateSelectedCarriers(selectedIds: unknown): void {
    const ids = Array.isArray(selectedIds)
      ? selectedIds.filter((id): id is string => id != null).map(id => String(id))
      : [];
    const pct = this.computedCarrierRetentionPct;
    const updated = ids.map(id => ({
      risk_company_id: id,
      retention_pct: pct,
      state_id: null,
      broker_id: null,
    }));
    this.form.controls.carriers.setValue(updated);
  }

  carrierName(riskCompanyId: string): string {
    const match = this.riskCompanyOptions.find(rc => rc.id === riskCompanyId);
    return match ? this.riskCompanyLabelFn(match) : riskCompanyId;
  }

  private applyComputedCarrierRetention(): void {
    const carriers = this.form.controls.carriers.value;
    if (carriers.length === 0) return;
    const pct = this.computedCarrierRetentionPct;
    const updated = carriers.map(carrier => ({ ...carrier, retention_pct: pct }));
    this.form.controls.carriers.setValue(updated);
  }

  updateReinsurerReinsurerId(index: number, value: unknown): void {
    const rows = this.form.controls.reinsurers.value;
    const updated = rows.map((row, i) =>
      i === index ? { ...row, reinsurer_id: value == null ? '' : String(value) } : row,
    );
    this.form.controls.reinsurers.setValue(updated);
  }

  updateReinsurerStateIds(index: number, value: unknown): void {
    const rows = this.form.controls.reinsurers.value;
    const stateIds = Array.isArray(value) ? value : value == null ? [] : [String(value)];
    const updated = rows.map((row, i) => (i === index ? { ...row, state_ids: stateIds } : row));
    this.form.controls.reinsurers.setValue(updated);
  }

  updateReinsurerBrokerId(index: number, value: unknown): void {
    const rows = this.form.controls.reinsurers.value;
    const updated = rows.map((row, i) =>
      i === index ? { ...row, broker_id: value == null ? null : String(value) } : row,
    );
    this.form.controls.reinsurers.setValue(updated);
  }

  updateReinsurerBrokerCommType(index: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const rows = this.form.controls.reinsurers.value;
    const updated = rows.map((row, i) =>
      i === index ? { ...row, broker_comm_type: value || null } : row,
    );
    this.form.controls.reinsurers.setValue(updated);
  }

  updateReinsurerCessionPct(index: number, event: Event): void {
    let value = Number((event.target as HTMLInputElement).value);
    value = Math.max(0, Math.min(100, value));
    value = Number(value.toFixed(2));

    const rows = this.form.controls.reinsurers.value;
    const updated = this.autoBalanceReinsurers(rows, index, value);
    this.form.controls.reinsurers.setValue(updated);
    this.applyComputedCarrierRetention();
  }

  private autoBalanceReinsurers(
    rows: TreatyReinsurer[],
    editedIndex: number,
    newValue: number,
  ): TreatyReinsurer[] {
    const n = rows.length;
    if (n <= 1) {
      return rows.map((row, i) => (i === editedIndex ? { ...row, cession_pct: newValue } : row));
    }

    const updatedRows = [...rows];
    updatedRows[editedIndex] = { ...rows[editedIndex], cession_pct: newValue };

    const isLast = editedIndex === n - 1;
    const otherIndices = isLast
      ? Array.from({ length: n - 1 }, (_, i) => i)
      : Array.from({ length: n - 1 - editedIndex }, (_, i) => editedIndex + 1 + i);

    const precedingSum = isLast
      ? 0
      : rows.slice(0, editedIndex).reduce((acc, r) => acc + (r.cession_pct || 0), 0);

    const targetOtherSum = 100 - precedingSum - newValue;
    const currentOtherSum = otherIndices.reduce(
      (acc, idx) => acc + (rows[idx].cession_pct || 0),
      0,
    );

    let distributedSum = 0;
    if (currentOtherSum > 0) {
      otherIndices.forEach((idx, i) => {
        const row = rows[idx];
        let share = 0;
        if (i === otherIndices.length - 1) {
          share = targetOtherSum - distributedSum;
        } else {
          share = Number((((row.cession_pct || 0) / currentOtherSum) * targetOtherSum).toFixed(2));
          distributedSum += share;
        }
        updatedRows[idx] = { ...row, cession_pct: Math.max(0, Number(share.toFixed(2))) };
      });
    } else {
      otherIndices.forEach((idx, i) => {
        const row = rows[idx];
        let share = 0;
        if (i === otherIndices.length - 1) {
          share = targetOtherSum - distributedSum;
        } else {
          share = Number((targetOtherSum / otherIndices.length).toFixed(2));
          distributedSum += share;
        }
        updatedRows[idx] = { ...row, cession_pct: Math.max(0, Number(share.toFixed(2))) };
      });
    }

    return updatedRows;
  }

  addReinsurerRow(): void {
    const rows = this.form.controls.reinsurers.value;
    if (rows.length === 0) {
      this.form.controls.reinsurers.setValue([
        {
          reinsurer_id: '',
          cession_pct: 100,
          state_id: null,
          state_ids: [],
          broker_id: null,
          broker_comm_type: null,
        },
      ]);
      this.applyComputedCarrierRetention();
      return;
    }

    const sum = rows.reduce((acc, r) => acc + (r.cession_pct || 0), 0);
    const remaining = Math.max(0, 100 - sum);

    this.form.controls.reinsurers.setValue([
      ...rows,
      {
        reinsurer_id: '',
        cession_pct: Number(remaining.toFixed(2)),
        state_id: null,
        state_ids: [],
        broker_id: null,
        broker_comm_type: null,
      },
    ]);
    this.applyComputedCarrierRetention();
  }

  removeReinsurerRow(index: number): void {
    const rows = this.form.controls.reinsurers.value;
    this.form.controls.reinsurers.setValue(rows.filter((_, i) => i !== index));
    this.applyComputedCarrierRetention();
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
