import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RiskCompanyFormValue } from '../models/risk-company-form.model';

@Injectable({ providedIn: 'root' })
export class RiskCompanyForm {
  createForm(): FormGroup<RiskCompanyFormModel> {
    return new FormGroup<RiskCompanyFormModel>({
      id: new FormControl<string | null>(null),
      risk_company_id: new FormControl('', { nonNullable: true }),
      company_id: new FormControl<number | null>(null),
      id_name: new FormControl('', { nonNullable: true }),
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      phone: new FormControl('', { nonNullable: true }),
      is_admitted: new FormControl(true, { nonNullable: true }),
      state: new FormControl('', { nonNullable: true }),
      address: new FormControl('', { nonNullable: true }),
      zip: new FormControl('', { nonNullable: true }),
      city: new FormControl('', { nonNullable: true }),
      notes: new FormControl('', { nonNullable: true }),
      is_active: new FormControl(true, { nonNullable: true }),
    });
  }

  patchForm(form: FormGroup<RiskCompanyFormModel>, value: RiskCompanyFormValue): void {
    form.patchValue(value);
  }

  toFormValue(form: FormGroup<RiskCompanyFormModel>): RiskCompanyFormValue {
    const raw = form.getRawValue();
    return { ...raw, id: raw.id ?? undefined };
  }
}

export interface RiskCompanyFormModel {
  id: FormControl<string | null>;
  risk_company_id: FormControl<string>;
  company_id: FormControl<number | null>;
  id_name: FormControl<string>;
  name: FormControl<string>;
  phone: FormControl<string>;
  is_admitted: FormControl<boolean>;
  state: FormControl<string>;
  address: FormControl<string>;
  zip: FormControl<string>;
  city: FormControl<string>;
  notes: FormControl<string>;
  is_active: FormControl<boolean>;
}
