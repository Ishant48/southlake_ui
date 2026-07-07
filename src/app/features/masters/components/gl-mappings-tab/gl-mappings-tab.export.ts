import { GlMappingsState } from '../../services/gl-mappings-state';
import { MastersExportData } from '../../services/masters-export-data';

export function buildGlMappingsExportData(state: GlMappingsState): MastersExportData {
  return {
    headers: ['GL Number', 'Type'],
    rows: state.glMappings.map(m => [state.getGLNumberDisplay(m), m.type]),
    filename: 'gl_mappings.csv',
  };
}
