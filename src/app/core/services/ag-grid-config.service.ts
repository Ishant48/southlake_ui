import { Injectable } from '@angular/core';
import { ColDef, GridOptions } from 'ag-grid-community';

@Injectable({
  providedIn: 'root',
})
export class AgGridConfigService {
  getDefaultGridOptions(): GridOptions {
    return {
      rowHeight: 64,
      headerHeight: 44,
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 25, 50, 100],
      suppressCellFocus: true,
      suppressRowClickSelection: true,
      defaultColDef: this.getDefaultColDef(),
      rowClass: 'custom-grid-row',
      localeText: {
        pageSizeSelectorLabel: 'Rows per page:',
      },
    };
  }

  getDefaultColDef(): ColDef {
    return {
      resizable: true,
      sortable: true,
      filter: false,
      flex: 1,
      minWidth: 100,
      wrapText: true,
      autoHeight: true,
    };
  }
}
