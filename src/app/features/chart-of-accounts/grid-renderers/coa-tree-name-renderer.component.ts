import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coa-tree-name-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="coa-name-cell" [style.padding-left.px]="treeDepth * 32">
      <span *ngIf="treeDepth > 0" class="tree-connector" [style.left.px]="(treeDepth - 1) * 32 + 12"></span>
      <div class="coa-name-text">
        <div class="coa-title">{{ description }}</div>
        <div class="coa-subtitle">{{ notes || (isRoot ? 'Insurance ledger root group' : '-') }}</div>
      </div>
    </div>
  `,
  styles: [`
    .coa-name-cell {
      display: flex;
      align-items: center;
      position: relative;
      min-height: 44px;
      padding-top: 4px;
      padding-bottom: 4px;
    }
    .coa-name-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .coa-title {
      font-size: 12.5px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.3;
    }
    .coa-subtitle {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 1px;
      line-height: 1.2;
    }
    .tree-connector {
      position: absolute;
      top: -10px;
      width: 14px;
      height: 32px;
      border-left: 1.5px solid #cbd5e1;
      border-bottom: 1.5px solid #cbd5e1;
      border-bottom-left-radius: 4px;
      pointer-events: none;
    }
  `]
})
export class CoaTreeNameRendererComponent implements ICellRendererAngularComp {
  treeDepth: number = 0;
  description: string = '';
  notes: string = '';
  isRoot: boolean = false;

  agInit(params: ICellRendererParams): void {
    this.updateData(params);
  }
  refresh(params: ICellRendererParams): boolean {
    this.updateData(params);
    return true;
  }
  private updateData(params: ICellRendererParams): void {
    if (params.data) {
      this.treeDepth = params.data.treeDepth || 0;
      this.description = params.data.description || '';
      this.notes = params.data.notes || '';
      this.isRoot = params.data.is_root || false;
    }
  }
}
