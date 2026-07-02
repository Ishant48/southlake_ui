import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-action-buttons-cell',
  standalone: true,
  template: `
    <div style="display:flex; gap:6px; height:100%; align-items:center;">
      @for (btn of buttons; track btn.label) {
        <button
          class="btn-action-outline"
          [class.btn-action-danger-outline]="btn.danger"
          [class.btn-icon-only]="isIconOnly(btn.action)"
          [title]="btn.label"
          (click)="onClick(btn.action, $event)"
        >
          @if (btn.action === 'uploadExcel') {
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          } @else if (btn.action === 'uploadItd') {
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <polyline points="9 15 12 12 15 15"></polyline>
            </svg>
          } @else if (btn.action === 'manualItd') {
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          } @else if (btn.action === 'edit') {
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          } @else if (btn.action === 'delete') {
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              ></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          } @else {
            {{ btn.label }}
          }
        </button>
      }
    </div>
  `,
  styles: [
    `
      .btn-action-outline {
        height: 30px;
        padding: 0 12px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        color: #475569;
        background: #ffffff;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        white-space: nowrap;
      }
      .btn-icon-only {
        width: 30px;
        padding: 0;
        border-radius: 6px;
      }
      .btn-action-outline:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        color: #0f172a;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
      }
      .btn-action-danger-outline {
        border-color: #fecdd3 !important;
        color: #e11d48 !important;
        background: #fff1f2 !important;
      }
      .btn-action-danger-outline:hover {
        background: #ffe4e6 !important;
        border-color: #fda4af !important;
        color: #be123c !important;
      }
    `,
  ],
})
export class ActionButtonsCellRenderer implements ICellRendererAngularComp {
  buttons: any[] = [];
  params: any;

  agInit(params: any): void {
    this.params = params;
    if (typeof params.buttons === 'function') {
      this.buttons = params.buttons(params.data);
    } else {
      this.buttons = params.buttons || [{ label: 'View / Edit', action: 'edit' }];
    }
  }

  refresh(params: any): boolean {
    return false;
  }

  isIconOnly(action: string): boolean {
    return ['uploadExcel', 'uploadItd', 'manualItd', 'edit', 'delete'].includes(action);
  }

  onClick(action: string, event: Event) {
    event.stopPropagation();
    if (this.params.onClick) {
      this.params.onClick(action, this.params.data);
    }
  }
}
