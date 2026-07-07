import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { GlMappingFormValue } from '../models/gl-mapping-form.model';

@Injectable({ providedIn: 'root' })
export class GlMappingForm {
  createForm(): FormGroup<GlMappingFormModel> {
    return new FormGroup<GlMappingFormModel>({
      id: new FormControl<string | null>(null),
      coa_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      type: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });
  }

  patchForm(form: FormGroup<GlMappingFormModel>, value: GlMappingFormValue): void {
    form.patchValue(value);
  }

  toFormValue(form: FormGroup<GlMappingFormModel>): GlMappingFormValue {
    const raw = form.getRawValue();
    return { ...raw, id: raw.id ?? undefined };
  }
}

export interface GlMappingFormModel {
  id: FormControl<string | null>;
  coa_id: FormControl<string>;
  type: FormControl<string>;
}
