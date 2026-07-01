import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-avatar-cell',
  standalone: true,
  template: `
    <div class="user-cell" style="display:flex; align-items:center; height:100%; gap:12px;">
      <div class="user-avatar" [style.background]="avatarColor" style="width: 32px; height: 32px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; flex-shrink: 0;">
        {{ initials }}
      </div>
      <div class="user-cell-text" style="display: flex; flex-direction: column; justify-content: center; line-height: 1.3;">
        <span class="user-name" style="font-weight: 600; color: #1e293b; font-size: 13px;">{{ name }}</span>
        @if (email) {
          <span class="user-email" style="font-size: 11.5px; color: #64748b;">{{ email }}</span>
        }
      </div>
    </div>
  `
})
export class AvatarCellRenderer implements ICellRendererAngularComp {
  initials = '';
  name = '';
  email = '';
  avatarColor = '#0f172a';

  agInit(params: any): void {
    this.refresh(params);
  }

  refresh(params: any): boolean {
    const user = params.value || params.data?.user || params.data;
    if (user) {
      this.name = user.name || 'Unknown User';
      this.email = user.email || '';
      this.initials = user.initials || this.getInitials(this.name);
      this.avatarColor = user.avatar_color || '#0f172a';
    } else {
      this.name = params.value || '';
      this.initials = this.getInitials(this.name);
    }
    return true;
  }

  private getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
