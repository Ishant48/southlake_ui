import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-status-badge-cell',
  standalone: true,
  template: `
    <div style="display:flex; align-items:center; height:100%;">
      <span [class]="'status-badge ' + badgeClass">
        <span class="badge-icon">{{ badgeIcon }}</span>
        <span>{{ statusText }}</span>
      </span>
    </div>
  `,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.2px;
        white-space: nowrap;
        line-height: 1.2;
        border: 1.5px solid transparent;
        transition: all 0.2s ease;
      }
      .status-badge.active {
        background: #f0fdf4;
        color: #16a34a;
        border-color: #bbf7d0;
      }
      .status-badge.inactive {
        background: #fffbe6;
        color: #d97706;
        border-color: #fef08a;
      }
      .status-badge.verified {
        background: #eff6ff;
        color: #2563eb;
        border-color: #bfdbfe;
      }
      .status-badge.pending {
        background: #fff7ed;
        color: #ea580c;
        border-color: #fed7aa;
      }
      .badge-icon {
        font-size: 11px;
        font-weight: 700;
      }
    `,
  ],
})
export class StatusBadgeCellRenderer implements ICellRendererAngularComp {
  badgeClass = 'active';
  badgeIcon = '✓';
  statusText = 'Active';

  agInit(params: ICellRendererParams): void {
    this.refresh(params);
  }

  refresh(params: ICellRendererParams): boolean {
    const rawVal = params.value?.toString().toLowerCase() || '';
    if (rawVal === 'active' || rawVal === 'true') {
      this.badgeClass = 'active';
      this.badgeIcon = '✓';
      this.statusText = 'Active';
    } else if (rawVal === 'verified') {
      this.badgeClass = 'verified';
      this.badgeIcon = '✓';
      this.statusText = 'Verified';
    } else if (rawVal === 'pending' || rawVal === 'unverified') {
      this.badgeClass = 'pending';
      this.badgeIcon = '✳';
      this.statusText = rawVal === 'unverified' ? 'Unverified' : 'Pending';
    } else {
      this.badgeClass = 'inactive';
      this.badgeIcon = '✕';
      this.statusText = 'Inactive';
    }
    return true;
  }
}
