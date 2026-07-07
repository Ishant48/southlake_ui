import { ColDef } from 'ag-grid-community';
import type { SimpleMasterTab } from '../components/simple-master-tab/simple-master-tab';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { SimpleMasterRecord } from '../models/master.model';
import { SimpleMode } from '../components/simple-form-modal/simple-form-modal';

export function buildProductsColumnDefs(ctx: SimpleMasterTab, statusCol: ColDef): ColDef[] {
  return [
    { headerName: 'PRODUCT ID', field: 'productId', flex: 1.5, minWidth: 120 },
    { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
    {
      headerName: 'LOB',
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
      valueGetter: p => p.data.lob?.name || '-',
      flex: 1.5,
      minWidth: 120,
    },
    {
      headerName: 'COB',
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
      valueGetter: p => p.data.cob?.name || '-',
      flex: 1.5,
      minWidth: 120,
    },
    { headerName: 'DESCRIPTION', field: 'description', flex: 2.5, minWidth: 180 },
    statusCol,
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Edit', action: 'edit' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: SimpleMasterRecord) => {
          if (action === 'edit') ctx.openSimpleEdit(SimpleMode.Product, data);
          if (action === 'delete') ctx.deleteSimple(SimpleMode.Product, data);
        },
      },
      flex: 0,
      width: 160,
      minWidth: 160,
      maxWidth: 160,
    },
  ];
}
