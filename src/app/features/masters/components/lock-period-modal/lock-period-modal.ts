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
import { LockPeriodForm, LockPeriodFormModel } from '../../forms/lock-period-form';

@Component({
  selector: 'app-lock-period-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lock-period-modal.html',
  styleUrl: './lock-period-modal.scss',
})
export class LockPeriodModal implements OnChanges {
  private lockPeriodForm = inject(LockPeriodForm);

  @Input() open = false;
  @Input() period = '';
  @Input() submitting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  form: FormGroup<LockPeriodFormModel> = this.lockPeriodForm.createForm();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['period']) {
      this.form.controls.period.setValue(this.period);
    }
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.controls.period.value);
  }
}
