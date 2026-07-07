import { ColDef } from 'ag-grid-community';
import type { MastersComponent } from '../masters.component';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { DocumentType } from '../models/master.model';
import { SimpleMode } from '../components/simple-form-modal/simple-form-modal';

export function buildDocumentTypesColumnDefs(ctx: MastersComponent, statusCol: ColDef): ColDef[] {
  return [
    { headerName: 'CODE', field: 'code', flex: 1.5, minWidth: 120 },
    { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
    { headerName: 'DESCRIPTION', field: 'description', flex: 3, minWidth: 200 },
    statusCol,
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Edit', action: 'edit' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: DocumentType) => {
          if (action === 'edit') ctx.openSimpleEdit(SimpleMode.DocumentType, data);
          if (action === 'delete') ctx.deleteSimple(SimpleMode.DocumentType, data);
        },
      },
      flex: 0,
      width: 160,
      minWidth: 160,
      maxWidth: 160,
    },
  ];
}
