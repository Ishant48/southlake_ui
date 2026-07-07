import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-status-badge-cell',
  imports: [],
  templateUrl: './status-badge-cell.html',
  styleUrl: './status-badge-cell.scss',
})
export class StatusBadgeCell implements ICellRendererAngularComp {
  badgeClass = 'active';
  badgeIcon = '✓';
  statusText = 'Active';

  agInit(params: ICellRendererParams): void {
    this.refresh(params);
  }

  refresh(params: ICellRendererParams): boolean {
    const rawVal = params.value?.toString().toLowerCase() ?? '';
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
