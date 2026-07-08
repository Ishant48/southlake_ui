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
import { StateMaster } from '../../models/master.model';
import { MgaForm, MgaFormModel } from '../../forms/mga-form';
import { MgaFormValue, createBlankMgaForm } from '../../models/mga-form.model';

@Component({
  selector: 'app-mga-form-modal',
  imports: [CommonModule, ReactiveFormsModule, DropdownSearchComponent],
  templateUrl: './mga-form-modal.html',
  styleUrl: './mga-form-modal.scss',
})
export class MgaFormModal implements OnChanges {
  private mgaForm = inject(MgaForm);

  @Input() open = false;
  @Input() title = '';
  @Input() model: MgaFormValue = createBlankMgaForm();
  @Input() isEditMode = false;
  @Input() isViewMode = false;
  @Input() submitting = false;
  @Input() stateOptions: StateMaster[] = [];
  @Input() stateAbbrLabelFn: (item: StateMaster) => string = () => '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<MgaFormValue>();

  form: FormGroup<MgaFormModel> = this.mgaForm.createForm();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.mgaForm.patchForm(this.form, this.model);
    }
    if (changes['isEditMode']) {
      const control = this.form.controls.mga_code;
      if (this.isEditMode) {
        control.disable();
      } else {
        control.enable();
      }
    }
    if (changes['isViewMode']) {
      if (this.isViewMode) {
        this.form.disable();
      } else {
        this.form.enable();
        if (this.isEditMode) {
          this.form.controls.mga_code.disable();
        }
      }
    }
  }

  setStateValue(value: unknown): void {
    this.form.controls.state.setValue(value == null ? '' : String(value));
  }

  updateOtherNameState(index: number, value: unknown): void {
    const rows = this.form.controls.other_names.value;
    const updated = rows.map((row, i) =>
      i === index ? { ...row, state: value == null ? '' : String(value) } : row,
    );
    this.form.controls.other_names.setValue(updated);
  }

  updateOtherNameDisplayName(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const rows = this.form.controls.other_names.value;
    const updated = rows.map((row, i) => (i === index ? { ...row, displayName: value } : row));
    this.form.controls.other_names.setValue(updated);
  }

  addOtherNameRow(): void {
    const rows = this.form.controls.other_names.value;
    this.form.controls.other_names.setValue([...rows, { state: '', displayName: '' }]);
  }

  removeOtherNameRow(index: number): void {
    const rows = this.form.controls.other_names.value;
    this.form.controls.other_names.setValue(rows.filter((_, i) => i !== index));
  }

  close(): void {
    this.closed.emit();
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.mgaForm.toFormValue(this.form));
  }
}
