import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export interface ActionButtonConfig {
  label: string;
  action: string;
  danger?: boolean;
}

export interface ActionButtonsCellRendererParams extends ICellRendererParams {
  buttons: ActionButtonConfig[] | ((data: unknown) => ActionButtonConfig[]);
  onClick?: (action: string, data: unknown) => void;
}

@Component({
  selector: 'app-action-buttons-cell',
  imports: [],
  templateUrl: './action-buttons-cell.html',
  styleUrl: './action-buttons-cell.scss',
})
export class ActionButtonsCell implements ICellRendererAngularComp {
  buttons: ActionButtonConfig[] = [];
  params!: ActionButtonsCellRendererParams;

  agInit(params: ActionButtonsCellRendererParams): void {
    this.params = params;
    if (typeof params.buttons === 'function') {
      this.buttons = params.buttons(params.data);
    } else {
      this.buttons = params.buttons ?? [{ label: 'View / Edit', action: 'edit' }];
    }
  }

  refresh(_params: ActionButtonsCellRendererParams): boolean {
    return false;
  }

  isIconOnly(action: string): boolean {
    return ['uploadExcel', 'uploadItd', 'manualItd', 'edit', 'delete', 'view'].includes(action);
  }

  onClick(action: string, event: Event): void {
    event.stopPropagation();
    if (this.params.onClick) {
      this.params.onClick(action, this.params.data);
    }
  }
}
