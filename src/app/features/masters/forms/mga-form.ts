import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MgaFormValue } from '../models/mga-form.model';

@Injectable({ providedIn: 'root' })
export class MgaForm {
  createForm(): FormGroup<MgaFormModel> {
    return new FormGroup<MgaFormModel>({
      id: new FormControl<string | null>(null),
      mga_code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      tax_payable_inhouse: new FormControl(false, { nonNullable: true }),
      ledger_amount: new FormControl(0, { nonNullable: true }),
      is_active: new FormControl(true, { nonNullable: true }),
      company_id: new FormControl<number | null>(null),
      id_name: new FormControl('', { nonNullable: true }),
      address: new FormControl('', { nonNullable: true }),
      zip: new FormControl('', { nonNullable: true }),
      city: new FormControl('', { nonNullable: true }),
      state: new FormControl('', { nonNullable: true }),
      phone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.pattern(/^[0-9+()\- ]*$/)],
      }),
      open_item: new FormControl(false, { nonNullable: true }),
      op_start_date: new FormControl('', { nonNullable: true }),
      other_names: new FormControl<{ state: string; displayName: string }[]>([], {
        nonNullable: true,
      }),
      naics_code: new FormControl('', { nonNullable: true }),
      contact_name: new FormControl('', { nonNullable: true }),
      contact_email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
      contact_phone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.pattern(/^[0-9+()\- ]*$/)],
      }),
    });
  }

  patchForm(form: FormGroup<MgaFormModel>, value: MgaFormValue): void {
    form.patchValue({
      ...value,
      other_names: [...(value.other_names ?? [])],
      naics_code: value.naics_code ?? '',
      contact_name: value.contact_name ?? '',
      contact_email: value.contact_email ?? '',
      contact_phone: value.contact_phone ?? '',
    });
  }

  toFormValue(form: FormGroup<MgaFormModel>): MgaFormValue {
    const raw = form.getRawValue();
    return { ...raw, id: raw.id ?? undefined };
  }
}

export interface MgaFormModel {
  id: FormControl<string | null>;
  mga_code: FormControl<string>;
  name: FormControl<string>;
  tax_payable_inhouse: FormControl<boolean>;
  ledger_amount: FormControl<number>;
  is_active: FormControl<boolean>;
  company_id: FormControl<number | null>;
  id_name: FormControl<string>;
  address: FormControl<string>;
  zip: FormControl<string>;
  city: FormControl<string>;
  state: FormControl<string>;
  phone: FormControl<string>;
  open_item: FormControl<boolean>;
  op_start_date: FormControl<string>;
  other_names: FormControl<{ state: string; displayName: string }[]>;
  naics_code: FormControl<string>;
  contact_name: FormControl<string>;
  contact_email: FormControl<string>;
  contact_phone: FormControl<string>;
}
