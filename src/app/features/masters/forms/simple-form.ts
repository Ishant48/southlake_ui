import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SimpleFormValue } from '../models/simple-form.model';

@Injectable({ providedIn: 'root' })
export class SimpleForm {
  createForm(): FormGroup<SimpleFormModel> {
    return new FormGroup<SimpleFormModel>({
      id: new FormControl<string | null>(null),
      code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      is_active: new FormControl(true, { nonNullable: true }),
      description: new FormControl('', { nonNullable: true }),
      type: new FormControl('', { nonNullable: true }),
      taxable: new FormControl(false, { nonNullable: true }),
      priority: new FormControl(1, { nonNullable: true }),
      fully_earned: new FormControl(false, { nonNullable: true }),
      contact_name: new FormControl('', { nonNullable: true }),
      contact_email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
      contact_phone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.pattern(/^[0-9+()\- ]*$/)],
      }),
      lob_id: new FormControl<string | string[]>('', { nonNullable: true }),
      cob_id: new FormControl<string | string[]>('', { nonNullable: true }),
      prefix: new FormControl('', { nonNullable: true }),
      next_value: new FormControl(1, { nonNullable: true }),
      padding_width: new FormControl(4, { nonNullable: true }),
    });
  }

  patchForm(form: FormGroup<SimpleFormModel>, value: SimpleFormValue): void {
    form.patchValue(value);
  }

  toFormValue(form: FormGroup<SimpleFormModel>): SimpleFormValue {
    const raw = form.getRawValue();
    return { ...raw, id: raw.id ?? undefined };
  }
}

export interface SimpleFormModel {
  id: FormControl<string | null>;
  code: FormControl<string>;
  name: FormControl<string>;
  is_active: FormControl<boolean>;
  description: FormControl<string>;
  type: FormControl<string>;
  taxable: FormControl<boolean>;
  priority: FormControl<number>;
  fully_earned: FormControl<boolean>;
  contact_name: FormControl<string>;
  contact_email: FormControl<string>;
  contact_phone: FormControl<string>;
  lob_id: FormControl<string | string[]>;
  cob_id: FormControl<string | string[]>;
  prefix: FormControl<string>;
  next_value: FormControl<number>;
  padding_width: FormControl<number>;
}
