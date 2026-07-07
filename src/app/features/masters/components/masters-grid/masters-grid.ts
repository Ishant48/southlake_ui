import { Component, Input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-masters-grid',
  imports: [AgGridAngular],
  templateUrl: './masters-grid.html',
  styleUrl: './masters-grid.scss',
})
export class MastersGrid {
  @Input() loading = false;
  @Input() rowData: unknown[] = [];
  @Input() columnDefs: ColDef[] = [];
  @Input({ required: true }) gridOptions!: GridOptions;
}
