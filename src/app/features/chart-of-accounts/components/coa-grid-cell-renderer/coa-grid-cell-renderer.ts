import { Component } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export type CoaGridCellVariant = 'badge' | 'tree-name' | 'balance-badge' | 'actions';

export interface CoaGridCellRendererParams extends ICellRendererParams {
  variant: CoaGridCellVariant;
}

@Component({
  selector: 'app-coa-grid-cell-renderer',
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './coa-grid-cell-renderer.html',
  styleUrl: './coa-grid-cell-renderer.scss',
})
export class CoaGridCellRenderer implements ICellRendererAngularComp {
  variant: CoaGridCellVariant = 'badge';
  params!: CoaGridCellRendererParams;

  // badge / tree-name / balance-badge shared state
  isRoot = false;
  treeDepth = 0;
  description = '';
  notes = '';
  balance = '';

  agInit(params: CoaGridCellRendererParams): void {
    this.variant = params.variant;
    this.params = params;
    this.updateData(params);
  }

  refresh(params: CoaGridCellRendererParams): boolean {
    this.params = params;
    this.updateData(params);
    return true;
  }

  private updateData(params: CoaGridCellRendererParams): void {
    this.isRoot = params.data?.is_root ?? false;
    this.treeDepth = params.data?.treeDepth ?? 0;
    this.description = params.data?.description ?? '';
    this.notes = params.data?.notes ?? '';
    this.balance = params.data?.normal_balance ?? '';
  }

  onView(event: Event): void {
    event.stopPropagation();
    this.params.context?.componentParent?.openViewModal(this.params.data);
  }

  onDocument(event: MouseEvent): void {
    event.stopPropagation();
    this.params.context?.componentParent?.openDocModal(this.params.data);
  }

  onNotes(event: MouseEvent): void {
    event.stopPropagation();
    this.params.context?.componentParent?.openNotesModal(this.params.data);
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.params.context?.componentParent?.openEditModal(this.params.data);
  }
}
