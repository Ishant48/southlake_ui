import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownSearchComponent } from '../../../../shared/components/dropdown-search/dropdown-search.component';
import { ChartOfAccount } from '../../../../core/models/chart-of-account.model';

export interface GlMappingFormValue {
  id?: string;
  coa_id?: string;
  type?: string;
}

export function createBlankGlMappingForm(): GlMappingFormValue {
  return { coa_id: '', type: '' };
}

@Component({
  selector: 'app-gl-mapping-form-modal',
  imports: [CommonModule, FormsModule, DropdownSearchComponent],
  templateUrl: './gl-mapping-form-modal.html',
  styleUrl: './gl-mapping-form-modal.scss',
})
export class GlMappingFormModal implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() model: GlMappingFormValue = createBlankGlMappingForm();
  @Input() submitting = false;
  @Input() coaOptions: ChartOfAccount[] = [];
  @Input() typeOptions: { id: string; name: string }[] = [];
  @Input() coaLabelFn: (item: ChartOfAccount) => string = item =>
    item ? `${item.account_code} - ${item.description}` : '';
  @Input() nameLabelFn: (item: { id: string; name: string }) => string = item =>
    item ? item.name : '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<GlMappingFormValue>();

  formValue: GlMappingFormValue = createBlankGlMappingForm();

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
