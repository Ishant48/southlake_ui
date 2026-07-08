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
import { StateForm, StateFormModel } from '../../forms/state-form';
import { StateFormValue, createBlankStateForm } from '../../models/state-form.model';

@Component({
  selector: 'app-state-form-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './state-form-modal.html',
  styleUrl: './state-form-modal.scss',
})
export class StateFormModal implements OnChanges {
  private stateForm = inject(StateForm);

  @Input() open = false;
  @Input() title = '';
  @Input() model: StateFormValue = createBlankStateForm();
  @Input() isEditMode = false;
  @Input() submitting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<StateFormValue>();

  form: FormGroup<StateFormModel> = this.stateForm.createForm();
  showFormError = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.stateForm.patchForm(this.form, this.model);
    }
    if (changes['isEditMode']) {
      const identityFields = [this.form.controls.state_code, this.form.controls.state_abbr];
      identityFields.forEach(control => (this.isEditMode ? control.disable() : control.enable()));
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
    this.save.emit(this.stateForm.toFormValue(this.form));
  }
}
