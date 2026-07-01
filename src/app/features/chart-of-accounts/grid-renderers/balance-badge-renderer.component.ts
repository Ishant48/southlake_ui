import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-balance-badge-renderer',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  template: `
    <span class="balance-badge" [class.debit]="balance === 'debit'" [class.credit]="balance === 'credit'">
      {{ (balance || '-') | titlecase }}
    </span>
  `,
  styles: [`
    .balance-badge {
      font-weight: 600;
      font-size: 12.5px;
    }
    .balance-badge.debit { color: #2563eb; }
    .balance-badge.credit { color: #4f46e5; }
  `]
})
export class BalanceBadgeRendererComponent implements ICellRendererAngularComp {
  balance: string = '';
  
  agInit(params: ICellRendererParams): void {
    this.balance = params.data?.normal_balance;
  }
  refresh(params: ICellRendererParams): boolean {
    this.balance = params.data?.normal_balance;
    return true;
  }
}
