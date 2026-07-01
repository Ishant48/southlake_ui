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
          (click)="onClick(btn.action, $event)">
          {{ btn.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    .btn-action-outline {
      height: 28px;
      padding: 0 10px;
      border-radius: 4px;
      border: 1.5px solid var(--gray-300);
      color: var(--gray-700);
      background: var(--white);
      font-size: 12px;
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
    .btn-action-danger-outline {
      border-color: var(--red) !important;
      color: var(--red) !important;
    }
    .btn-action-danger-outline:hover {
      background: var(--red-bg) !important;
      border-color: var(--red) !important;
      color: var(--red) !important;
    }
  `]
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

  onClick(action: string, event: Event) {
    event.stopPropagation();
    if (this.params.onClick) {
      this.params.onClick(action, this.params.data);
    }
  }
}
