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
  TreatyCarrier,
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

  get combinedTotalPct(): number {
    const carrierSum = this.form.controls.carriers.value.reduce(
      (acc, c) => acc + (c.retention_pct ?? 0),
      0,
    );
    const reinsurerSum = this.form.controls.reinsurers.value.reduce(
      (acc, r) => acc + (r.cession_pct ?? 0),
      0,
    );
    return Number((carrierSum + reinsurerSum).toFixed(2));
  }

  onCarrierSelectedValuesChange(values: TreatySelectionMap): void {
    const ids = Object.keys(values).filter(id => values[id]);
    this.updateSelectedCarriers(ids);
  }

  updateSelectedCarriers(selectedIds: unknown): void {
    const ids = Array.isArray(selectedIds)
      ? selectedIds.filter((id): id is string => id != null).map(id => String(id))
      : [];
    const prevByCarrierId = new Map(
      this.form.controls.carriers.value.map(c => [c.risk_company_id, c]),
    );
    const carriers = ids.map(
      id =>
        prevByCarrierId.get(id) ?? {
          risk_company_id: id,
          retention_pct: 0,
          state_id: null,
          broker_id: null,
        },
    );
    const reinsurers = this.form.controls.reinsurers.value;
    const shares = this.rescaleToHundred(this.combinedShares(reinsurers, carriers));
    this.applyCombinedShares(reinsurers, carriers, shares);
  }

  carrierName(riskCompanyId: string): string {
    const match = this.riskCompanyOptions.find(rc => rc.id === riskCompanyId);
    return match ? this.riskCompanyLabelFn(match) : riskCompanyId;
  }

  updateCarrierRetentionPct(index: number, event: Event): void {
    let value = Number((event.target as HTMLInputElement).value);
    value = Math.max(0, Math.min(100, value));
    value = Number(value.toFixed(2));

    const reinsurers = this.form.controls.reinsurers.value;
    const carriers = this.form.controls.carriers.value;
    const combinedIndex = reinsurers.length + index;
    const shares = this.rebalanceShares(
      this.combinedShares(reinsurers, carriers),
      combinedIndex,
      value,
    );
    this.applyCombinedShares(reinsurers, carriers, shares);
  }

  removeCarrierRow(index: number): void {
    const carriers = this.form.controls.carriers.value.filter((_, i) => i !== index);
    const reinsurers = this.form.controls.reinsurers.value;
    const shares = this.rescaleToHundred(this.combinedShares(reinsurers, carriers));
    this.applyCombinedShares(reinsurers, carriers, shares);
  }

  // Combines reinsurer cession % and carrier retention % into one ordered list (reinsurers
  // first, then carriers) so both kinds of rows can be rebalanced against a single 100% total.
  private combinedShares(reinsurers: TreatyReinsurer[], carriers: TreatyCarrier[]): number[] {
    return [...reinsurers.map(r => r.cession_pct ?? 0), ...carriers.map(c => c.retention_pct ?? 0)];
  }

  private applyCombinedShares(
    reinsurers: TreatyReinsurer[],
    carriers: TreatyCarrier[],
    shares: number[],
  ): void {
    const newReinsurerPcts = shares.slice(0, reinsurers.length);
    const newCarrierPcts = shares.slice(reinsurers.length);
    this.form.controls.reinsurers.setValue(
      reinsurers.map((r, i) => ({ ...r, cession_pct: newReinsurerPcts[i] })),
    );
    this.form.controls.carriers.setValue(
      carriers.map((c, i) => ({ ...c, retention_pct: newCarrierPcts[i] })),
    );
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

    const reinsurers = this.form.controls.reinsurers.value;
    const carriers = this.form.controls.carriers.value;
    const shares = this.rebalanceShares(this.combinedShares(reinsurers, carriers), index, value);
    this.applyCombinedShares(reinsurers, carriers, shares);
  }

  /** Sets shares[editedIndex] to newValue and pushes the difference onto subsequent shares
   * (preceding shares are left untouched), except when the edited share is the last one, in
   * which case every other share is rebalanced proportionally. Keeps the combined total at 100. */
  private rebalanceShares(shares: number[], editedIndex: number, newValue: number): number[] {
    const n = shares.length;
    if (n <= 1) {
      return shares.map((v, i) => (i === editedIndex ? newValue : v));
    }

    const updated = [...shares];
    updated[editedIndex] = newValue;

    const isLast = editedIndex === n - 1;
    const otherIndices = isLast
      ? Array.from({ length: n - 1 }, (_, i) => i)
      : Array.from({ length: n - 1 - editedIndex }, (_, i) => editedIndex + 1 + i);

    const precedingSum = isLast
      ? 0
      : shares.slice(0, editedIndex).reduce((acc, v) => acc + (v || 0), 0);

    const targetOtherSum = 100 - precedingSum - newValue;
    const currentOtherSum = otherIndices.reduce((acc, idx) => acc + (shares[idx] || 0), 0);

    let distributedSum = 0;
    otherIndices.forEach((idx, i) => {
      let share: number;
      if (i === otherIndices.length - 1) {
        share = targetOtherSum - distributedSum;
      } else if (currentOtherSum > 0) {
        share = Number((((shares[idx] || 0) / currentOtherSum) * targetOtherSum).toFixed(2));
        distributedSum += share;
      } else {
        share = Number((targetOtherSum / otherIndices.length).toFixed(2));
        distributedSum += share;
      }
      updated[idx] = Math.max(0, Number(share.toFixed(2)));
    });

    return updated;
  }

  /** Proportionally rescales all shares (or splits evenly if they're all currently 0) so
   * they sum to exactly 100 — used after adding/removing a row or changing carrier selection. */
  private rescaleToHundred(shares: number[]): number[] {
    const n = shares.length;
    if (n === 0) return shares;

    const total = shares.reduce((acc, v) => acc + (v || 0), 0);
    const raw = total > 0 ? shares.map(v => ((v || 0) / total) * 100) : shares.map(() => 100 / n);

    let distributed = 0;
    return raw.map((v, i) => {
      if (i === n - 1) return Math.max(0, Number((100 - distributed).toFixed(2)));
      const rounded = Math.max(0, Number(v.toFixed(2)));
      distributed += rounded;
      return rounded;
    });
  }

  addReinsurerRow(): void {
    const carriers = this.form.controls.carriers.value;
    const newRow: TreatyReinsurer = {
      reinsurer_id: '',
      cession_pct: 0,
      state_id: null,
      state_ids: [],
      broker_id: null,
      broker_comm_type: null,
    };
    const reinsurers = [...this.form.controls.reinsurers.value, newRow];
    const shares = this.rescaleToHundred(this.combinedShares(reinsurers, carriers));
    this.applyCombinedShares(reinsurers, carriers, shares);
  }

  removeReinsurerRow(index: number): void {
    const reinsurers = this.form.controls.reinsurers.value.filter((_, i) => i !== index);
    const carriers = this.form.controls.carriers.value;
    const shares = this.rescaleToHundred(this.combinedShares(reinsurers, carriers));
    this.applyCombinedShares(reinsurers, carriers, shares);
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
