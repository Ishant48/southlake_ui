import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StateFormValue } from '../models/state-form.model';

@Injectable({ providedIn: 'root' })
export class StateForm {
  createForm(): FormGroup<StateFormModel> {
    return new FormGroup<StateFormModel>({
      id: new FormControl<string | null>(null),
      state_code: new FormControl<number | null>(null, { validators: [Validators.required] }),
      state_abbr: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(2)],
      }),
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      notes: new FormControl('', { nonNullable: true }),
      is_active: new FormControl(true, { nonNullable: true }),
    });
  }

  patchForm(form: FormGroup<StateFormModel>, value: StateFormValue): void {
    form.patchValue(value);
  }

  toFormValue(form: FormGroup<StateFormModel>): StateFormValue {
    const raw = form.getRawValue();
    return { ...raw, id: raw.id ?? undefined };
  }
}

export interface StateFormModel {
  id: FormControl<string | null>;
  state_code: FormControl<number | null>;
  state_abbr: FormControl<string>;
  name: FormControl<string>;
  notes: FormControl<string>;
  is_active: FormControl<boolean>;
}
