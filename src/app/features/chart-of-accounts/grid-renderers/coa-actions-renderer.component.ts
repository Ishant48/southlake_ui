import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coa-actions-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="text-align: center; width: 100%;">
      <ng-container *ngIf="isRoot; else subActions">
        <span class="view-link" (click)="onView($event)">View</span>
      </ng-container>
      <ng-template #subActions>
        <div class="action-buttons-list" style="justify-content: center;">
          <button class="btn-action-outline" (click)="onDocument($event)">Document</button>
          <button class="btn-action-outline" (click)="onNotes($event)">Notes</button>
          <button class="btn-action-outline" (click)="onEdit($event)">Edit</button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .action-buttons-list {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: nowrap;
      justify-content: center;
    }
    .btn-action-outline {
      height: 26px;
      padding: 0 6px;
      border-radius: 4px;
      border: 1.5px solid var(--gray-300);
      color: var(--gray-700);
      background: var(--white);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--transition), border-color var(--transition), color var(--transition);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      white-space: nowrap;
    }
    .btn-action-outline:hover {
      background: var(--gray-100);
      border-color: var(--gray-400);
      color: var(--gray-900);
    }
    .view-link {
      color: var(--coral);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: color var(--transition);
    }
    .view-link:hover {
      color: var(--coral-hover);
      text-decoration: underline;
    }
  `]
})
export class CoaActionsRendererComponent implements ICellRendererAngularComp {
  isRoot: boolean = false;
  params!: ICellRendererParams;

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.isRoot = params.data?.is_root;
  }
  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.isRoot = params.data?.is_root;
    return true;
  }

  onView(event: MouseEvent): void {
    event.stopPropagation();
    if (this.params.context && this.params.context.componentParent) {
      this.params.context.componentParent.openViewModal(this.params.data);
    }
  }

  onDocument(event: MouseEvent): void {
    event.stopPropagation();
    if (this.params.context && this.params.context.componentParent) {
      this.params.context.componentParent.openDocModal(this.params.data);
    }
  }

  onNotes(event: MouseEvent): void {
    event.stopPropagation();
    if (this.params.context && this.params.context.componentParent) {
      this.params.context.componentParent.openNotesModal(this.params.data);
    }
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    if (this.params.context && this.params.context.componentParent) {
      this.params.context.componentParent.openEditModal(this.params.data);
    }
  }
}
