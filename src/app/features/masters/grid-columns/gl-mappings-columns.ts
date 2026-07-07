import { ColDef, ICellRendererParams } from 'ag-grid-community';
import type { GlMappingsTab } from '../components/gl-mappings-tab/gl-mappings-tab';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { GlMapping } from '../models/gl-mapping.model';

export function buildGlMappingsColumnDefs(ctx: GlMappingsTab): ColDef[] {
  return [
    {
      headerName: 'GL NUMBER',
      valueGetter: p => ctx.getGLNumberDisplay(p.data),
      flex: 2,
      minWidth: 200,
    },
    {
      headerName: 'TYPE',
      field: 'type',
      cellRenderer: (p: ICellRendererParams<GlMapping, string>) =>
        `<span class="type-badge ${p.value?.toLowerCase()}">${p.value}</span>`,
      flex: 1,
      minWidth: 100,
    },
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Edit', action: 'edit' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: GlMapping) => {
          if (action === 'edit') ctx.openGlMappingEdit(data);
          if (action === 'delete') ctx.deleteGlMapping(data);
        },
      },
      flex: 0,
      width: 160,
      minWidth: 160,
      maxWidth: 160,
    },
  ];
}
