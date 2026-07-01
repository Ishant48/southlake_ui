import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-status-badge-cell',
  standalone: true,
  template: `
    <div style="display:flex; align-items:center; height:100%;">
      <span class="status-badge" [class.active]="isActive" [class.inactive]="!isActive">
        {{ statusText }}
      </span>
    </div>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.3px;
      white-space: nowrap;
      line-height: 1;
    }
    .status-badge.active { background: #ecfdf5; color: #10b981; }
    .status-badge.inactive { background: #f1f5f9; color: #64748b; }
  `]
})
export class StatusBadgeCellRenderer implements ICellRendererAngularComp {
  isActive = false;
  statusText = '';

  agInit(params: ICellRendererParams): void {
    this.refresh(params);
  }

  refresh(params: ICellRendererParams): boolean {
    const value = params.value?.toString().toLowerCase();
    this.isActive = value === 'active' || value === 'true';
    this.statusText = this.isActive ? 'Active' : 'Inactive';
    return true;
  }
}
