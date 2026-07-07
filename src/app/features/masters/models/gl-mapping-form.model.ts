export interface GlMappingFormValue {
  id?: string;
  coa_id?: string;
  type?: string;
}

export function createBlankGlMappingForm(): GlMappingFormValue {
  return { coa_id: '', type: '' };
}
