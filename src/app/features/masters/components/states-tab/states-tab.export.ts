import { StatesState } from '../../services/states-state';
import { MastersExportData } from '../../services/masters-export-data';

export function buildStatesExportData(state: StatesState): MastersExportData {
  return {
    headers: ['State Code', 'State Abbr', 'State Name', 'Status'],
    rows: state.states.map(s => [
      s.state_code,
      s.state_abbr,
      s.name,
      s.is_active ? 'Active' : 'Inactive',
    ]),
    filename: 'states.csv',
  };
}
