import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LockPeriodFormValue } from '../models/lock-period-form.model';

@Injectable({ providedIn: 'root' })
export class LockPeriodForm {
  createForm(): FormGroup<LockPeriodFormModel> {
    return new FormGroup<LockPeriodFormModel>({
      period: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });
  }

  patchForm(form: FormGroup<LockPeriodFormModel>, value: LockPeriodFormValue): void {
    form.patchValue(value);
  }

  toFormValue(form: FormGroup<LockPeriodFormModel>): LockPeriodFormValue {
    return form.getRawValue();
  }
}

export interface LockPeriodFormModel {
  period: FormControl<string>;
}
