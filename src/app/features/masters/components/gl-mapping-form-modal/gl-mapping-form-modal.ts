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
import { ChartOfAccount } from '../../../../core/models/chart-of-account.model';
import { GlMappingForm, GlMappingFormModel } from '../../forms/gl-mapping-form';
import { GlMappingFormValue, createBlankGlMappingForm } from '../../models/gl-mapping-form.model';

@Component({
  selector: 'app-gl-mapping-form-modal',
  imports: [CommonModule, ReactiveFormsModule, DropdownSearchComponent],
  templateUrl: './gl-mapping-form-modal.html',
  styleUrl: './gl-mapping-form-modal.scss',
})
export class GlMappingFormModal implements OnChanges {
  private glMappingForm = inject(GlMappingForm);

  @Input() open = false;
  @Input() title = '';
  @Input() model: GlMappingFormValue = createBlankGlMappingForm();
  @Input() isEditMode = false;
  @Input() isViewMode = false;
  @Input() submitting = false;
  @Input() coaOptions: ChartOfAccount[] = [];
  @Input() typeOptions: { id: string; name: string }[] = [];
  @Input() coaLabelFn: (item: ChartOfAccount) => string = item =>
    item ? `${item.account_code} - ${item.description}` : '';
  @Input() nameLabelFn: (item: { id: string; name: string }) => string = item =>
    item ? item.name : '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<GlMappingFormValue>();

  form: FormGroup<GlMappingFormModel> = this.glMappingForm.createForm();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.glMappingForm.patchForm(this.form, this.model);
    }
    if (changes['isViewMode']) {
      if (this.isViewMode) {
        this.form.disable();
      }
    }
  }

  close(): void {
    this.closed.emit();
  }

  onCoaIdChange(value: unknown): void {
    this.form.controls.coa_id.setValue((value as string) ?? '');
  }

  onTypeChange(value: unknown): void {
    this.form.controls.type.setValue((value as string) ?? '');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.glMappingForm.toFormValue(this.form));
  }
}
