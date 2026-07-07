import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ItdExhibit, ItdFormValue } from '../models/itd.model';

@Injectable({ providedIn: 'root' })
export class ItdForm {
  createForm(): FormGroup<ItdFormModel> {
    return new FormGroup<ItdFormModel>({
      program: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      month_key: new FormControl('', { nonNullable: true }),
      month_label: new FormControl('', { nonNullable: true }),
      exhibits: new FormControl<Record<string, ItdExhibit>>({}, { nonNullable: true }),
    });
  }

  patchForm(form: FormGroup<ItdFormModel>, value: ItdFormValue): void {
    form.patchValue({
      ...value,
      exhibits: { ...value.exhibits },
    });
  }

  toFormValue(form: FormGroup<ItdFormModel>): ItdFormValue {
    return form.getRawValue();
  }
}

export interface ItdFormModel {
  program: FormControl<string>;
  month_key: FormControl<string>;
  month_label: FormControl<string>;
  exhibits: FormControl<Record<string, ItdExhibit>>;
}
