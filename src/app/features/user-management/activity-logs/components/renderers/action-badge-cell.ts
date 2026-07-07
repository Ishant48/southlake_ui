import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-action-badge-cell',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; height: 100%;">
      <span
        [style.background]="bg"
        [style.color]="text"
        style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center;"
      >
        {{ action }}
      </span>
    </div>
  `,
})
export class ActionBadgeRenderer implements ICellRendererAngularComp {
  action = '';
  bg = '';
  text = '';

  agInit(params: ICellRendererParams): void {
    this.action = params.value || '';

    const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
      login: { bg: 'var(--blue-bg, #eff6ff)', text: 'var(--blue, #3b82f6)' },
      logout: { bg: 'var(--gray-200, #e2e8f0)', text: 'var(--gray-600, #475569)' },
      create: { bg: 'var(--green-bg, #ecfdf5)', text: 'var(--green, #10b981)' },
      update: { bg: 'var(--orange-bg, #fffbeb)', text: 'var(--orange, #f59e0b)' },
      delete: { bg: 'var(--red-bg, #fef2f2)', text: 'var(--red, #ef4444)' },
    };

    const style = ACTION_COLORS[this.action.toLowerCase()] ?? {
      bg: 'rgba(13,27,75,0.08)',
      text: '#0d1b4b',
    };
    this.bg = style.bg;
    this.text = style.text;
  }

  refresh(): boolean {
    return false;
  }
}
