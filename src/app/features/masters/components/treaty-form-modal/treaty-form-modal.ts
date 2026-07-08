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

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/prefer-nullish-coalescing -- productOptions/lobs/cobs shapes are loosely typed throughout this pre-existing component, and several `||` fallbacks intentionally treat any falsy value the same; not touched by the permission-hardening change that required editing this file, out of scope to retype here */

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
  @Input() productOptions: any[] = [];

  @Input() riskCompanyLabelFn: (item: RiskCompany) => string = () => '';
  @Input() reinsurerLabelFn: (item: ReinsurerCompany) => string = () => '';
  @Input() stateLabelFn: (item: StateMaster) => string = () => '';
  @Input() brokerLabelFn: (item: SimpleMasterRecord) => string = () => '';
  @Input() mgaLabelFn: (item: MgaMaster) => string = () => '';
  @Input() lobLabelFn: (item: LineOfBusiness) => string = () => '';
  @Input() cobLabelFn: (item: CobMaster) => string = () => '';

  productLabelFn = (item: any): string => {
    return item ? `${item.product_id} - ${item.name}` : '';
  };

  reinsurerOrRiskCompanyLabelFn = (item: any): string => {
    if (!item) return '';
    if ('reinsurer_company_id' in item) {
      return `${item.name} (${item.reinsurer_company_id}) [Reinsurer]`;
    }
    if ('risk_company_id' in item) {
      return `${item.name} (${item.risk_company_id}) [Risk Company]`;
    }
    return item.name || '';
  };

  get combinedReinsurerAndRiskCompanyOptions(): any[] {
    const reinsurers = this.reinsurerOptions || [];
    const riskCos = this.riskCompanyOptions || [];
    return [...reinsurers, ...riskCos];
  }

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<TreatySaveEvent>();

  form: FormGroup<TreatyFormModel> = this.treatyForm.createForm();
  showFormError = false;
  formSelectedStates: TreatySelectionMap = {};
  formSelectedLobs: TreatySelectionMap = {};
  formSelectedCobs: TreatySelectionMap = {};
  selectedProductId: string | null = null;

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
    if (changes['selectedLobs'] || changes['selectedCobs'] || changes['productOptions']) {
      this.findMatchingProduct();
    }
    if (changes['isEditMode']) {
      if (this.isEditMode) {
        this.form.controls.treaty_code.disable();
      } else {
        this.form.controls.treaty_code.enable();
      }
    }
  }

  findMatchingProduct(): void {
    if (!this.productOptions || this.productOptions.length === 0) return;
    const selectedLobIds = Object.keys(this.formSelectedLobs).filter(
      id => this.formSelectedLobs[id],
    );
    const selectedCobIds = Object.keys(this.formSelectedCobs).filter(
      id => this.formSelectedCobs[id],
    );

    if (selectedLobIds.length === 0 && selectedCobIds.length === 0) {
      this.selectedProductId = '';
      return;
    }

    const bestProduct = this.productOptions.find(p => {
      const pLobIds = (p.lobs || []).map((l: any) => l.id);
      const pCobIds = (p.cobs || []).map((c: any) => c.id);
      const hasAllLobs =
        pLobIds.length > 0 && pLobIds.every((id: string) => selectedLobIds.includes(id));
      const hasAllCobs =
        pCobIds.length > 0 && pCobIds.every((id: string) => selectedCobIds.includes(id));
      return hasAllLobs && hasAllCobs;
    });

    if (bestProduct) {
      this.selectedProductId = bestProduct.id;
    } else {
      const fallbackProduct = this.productOptions.find(p => {
        const pLobIds = (p.lobs || []).map((l: any) => l.id);
        return pLobIds.some((id: string) => selectedLobIds.includes(id));
      });
      this.selectedProductId = fallbackProduct ? fallbackProduct.id : '';
    }
  }

  onProductChange(productId: unknown): void {
    const id = productId == null ? '' : String(productId);
    this.selectedProductId = id;

    const selectedProduct = this.productOptions.find(p => p.id === id);
    if (selectedProduct) {
      this.formSelectedLobs = {};
      this.formSelectedCobs = {};

      (selectedProduct.lobs || []).forEach((l: any) => {
        this.formSelectedLobs[l.id] = true;
      });
      (selectedProduct.cobs || []).forEach((c: any) => {
        this.formSelectedCobs[c.id] = true;
      });
    } else {
      this.formSelectedLobs = {};
      this.formSelectedCobs = {};
    }
  }

  getSelectedProductLobs(): string {
    const selectedProduct = this.productOptions.find(p => p.id === this.selectedProductId);
    if (!selectedProduct) return 'No Product Selected';
    const names = (selectedProduct.lobs || []).map((l: any) => l.name);
    return names.length > 0 ? names.join(', ') : 'No LOBs configured';
  }

  getSelectedProductCobs(): string {
    const selectedProduct = this.productOptions.find(p => p.id === this.selectedProductId);
    if (!selectedProduct) return 'No Product Selected';
    const names = (selectedProduct.cobs || []).map((c: any) => c.name);
    return names.length > 0 ? names.join(', ') : 'No COBs configured';
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
  }

  private autoBalanceReinsurers(rows: any[], editedIndex: number, newValue: number): any[] {
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
          broker_id: null,
          broker_comm_type: null,
        },
      ]);
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
        broker_id: null,
        broker_comm_type: null,
      },
    ]);
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
      this.showFormError = true;
      return;
    }
    this.showFormError = false;
    this.save.emit({
      form: this.treatyForm.toFormValue(this.form),
      selectedStates: this.formSelectedStates,
      selectedLobs: this.formSelectedLobs,
      selectedCobs: this.formSelectedCobs,
    });
  }
}
