export interface StateFormValue {
  id?: string;
  state_code: number | null;
  state_abbr: string;
  name: string;
  notes: string;
  is_active: boolean;
}

export function createBlankStateForm(): StateFormValue {
  return { state_code: null, state_abbr: '', name: '', notes: '', is_active: true };
}
