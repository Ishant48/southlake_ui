import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coa-badge-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="coa-badge" [class.root]="isRoot" [class.sub]="!isRoot">
      {{ isRoot ? 'Root COA' : 'Sub COA' }}
    </span>
  `,
  styles: [
    `
      .coa-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        user-select: none;
        white-space: nowrap;
      }
      .coa-badge.root {
        background-color: #e2f5ec;
        color: #0d9488;
        border: 1px solid #ccfbf1;
      }
      .coa-badge.sub {
        background-color: #fff3e0;
        color: #f59e0b;
        border: 1px solid #fef3c7;
      }
    `,
  ],
})
export class CoaBadgeRendererComponent implements ICellRendererAngularComp {
  isRoot: boolean = false;

  agInit(params: ICellRendererParams): void {
    this.isRoot = params.data?.is_root;
  }
  refresh(params: ICellRendererParams): boolean {
    this.isRoot = params.data?.is_root;
    return true;
  }
}
