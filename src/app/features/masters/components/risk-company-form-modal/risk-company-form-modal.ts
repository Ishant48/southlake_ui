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
import { RiskCompanyForm, RiskCompanyFormModel } from '../../forms/risk-company-form';
import {
  RiskCompanyFormValue,
  createBlankRiskCompanyForm,
} from '../../models/risk-company-form.model';

@Component({
  selector: 'app-risk-company-form-modal',
  imports: [CommonModule, ReactiveFormsModule, DropdownSearchComponent],
  templateUrl: './risk-company-form-modal.html',
  styleUrl: './risk-company-form-modal.scss',
})
export class RiskCompanyFormModal implements OnChanges {
  private riskCompanyForm = inject(RiskCompanyForm);

  @Input() open = false;
  @Input() title = '';
  @Input() model: RiskCompanyFormValue = createBlankRiskCompanyForm();
  @Input() isEditMode = false;
  @Input() isViewMode = false;
  @Input() submitting = false;
  @Input() stateOptions: StateMaster[] = [];
  @Input() stateAbbrLabelFn: (item: StateMaster) => string = item =>
    item ? `${item.state_abbr} - ${item.name}` : '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<RiskCompanyFormValue>();

  form: FormGroup<RiskCompanyFormModel> = this.riskCompanyForm.createForm();
  showFormError = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.riskCompanyForm.patchForm(this.form, this.model);
    }
    if (changes['isEditMode']) {
      if (this.isEditMode) {
        this.form.controls.company_id.disable();
      } else {
        this.form.controls.company_id.enable();
      }
    }
    if (changes['isViewMode']) {
      if (this.isViewMode) {
        this.form.disable();
      } else {
        this.form.enable();
        if (this.isEditMode) {
          this.form.controls.company_id.disable();
        }
      }
    }
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
    this.save.emit(this.riskCompanyForm.toFormValue(this.form));
  }
}
