import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-status-badge-cell',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; height: 100%;">
      <span
        [style.background]="bg"
        [style.color]="text"
        style="padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center;"
      >
        {{ status }}
      </span>
    </div>
  `,
})
export class StatusBadgeRenderer implements ICellRendererAngularComp {
  status = '';
  bg = '';
  text = '';

  agInit(params: ICellRendererParams): void {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty status string should also default to "Success"
    this.status = params.value || 'Success';

    const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
      success: { bg: '#ecfdf5', text: '#10b981' },
      failed: { bg: '#fef2f2', text: '#ef4444' },
      pending: { bg: '#fffbeb', text: '#f59e0b' },
      critical: { bg: '#fee2e2', text: '#b91c1c' },
    };

    const style = STATUS_COLORS[this.status.toLowerCase()] ?? { bg: '#f1f5f9', text: '#64748b' };
    this.bg = style.bg;
    this.text = style.text;
  }

  refresh(): boolean {
    return false;
  }
}
