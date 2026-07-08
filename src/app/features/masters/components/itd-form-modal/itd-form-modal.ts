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
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ItdForm, ItdFormModel } from '../../forms/itd-form';
import { ItdExhibit, ItdFormValue, ItdMonthOption, ItdStateOption } from '../../models/itd.model';

@Component({
  selector: 'app-itd-form-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './itd-form-modal.html',
  styleUrl: './itd-form-modal.scss',
})
export class ItdFormModal implements OnChanges {
  private itdForm = inject(ItdForm);

  @Input() open = false;
  @Input() isEditMode = false;
  @Input() model: ItdFormValue = { program: '', month_key: '', month_label: '', exhibits: {} };
  @Input() itdStatesList: ItdStateOption[] = [];
  @Input() monthsList: ItdMonthOption[] = [];
  @Input() yearsList: string[] = [];
  @Input() initialMonth = '12';
  @Input() initialYear = '2025';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<ItdFormValue>();

  form: FormGroup<ItdFormModel> = this.itdForm.createForm();
  showFormError = false;
  selectedStateCode = '';
  selectedMonth = '12';
  selectedYear = '2025';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.itdForm.patchForm(this.form, this.model);
    }
    if (changes['initialMonth']) {
      this.selectedMonth = this.initialMonth;
    }
    if (changes['initialYear']) {
      this.selectedYear = this.initialYear;
    }
    if (changes['itdStatesList']) {
      this.selectedStateCode = this.itdStatesList[0]?.code || '';
    }
  }

  onMonthYearChange(): void {
    const monthObj = this.monthsList.find(m => m.value === this.selectedMonth);
    const monthLabel = monthObj ? monthObj.label : 'December';
    this.form.controls.month_key.setValue(`${this.selectedYear}-${this.selectedMonth}`);
    this.form.controls.month_label.setValue(`${monthLabel} ${this.selectedYear}`);
  }

  updateExhibitField(stateCode: string, field: keyof ItdExhibit, value: number): void {
    const exhibits = this.form.controls.exhibits.value;
    const current = exhibits[stateCode];
    if (!current) {
      return;
    }
    this.form.controls.exhibits.setValue({
      ...exhibits,
      [stateCode]: { ...current, [field]: value },
    });
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
    this.save.emit(this.itdForm.toFormValue(this.form));
  }
}
