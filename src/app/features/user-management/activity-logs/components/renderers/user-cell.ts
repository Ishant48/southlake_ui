import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-user-cell',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; gap: 12px; height: 100%;">
      <div
        style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 500; font-size: 13px;"
        [style.background-color]="avatarColor"
      >
        {{ initials }}
      </div>
      <div
        style="display: flex; flex-direction: column; line-height: 1.3; justify-content: center;"
      >
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-weight: 500; color: #0f172a; font-size: 13px;">{{ name }}</span>
          @if (role) {
            <span
              style="font-size: 10px; padding: 2px 6px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; font-weight: 500;"
            >
              {{ role }}
            </span>
          }
        </div>
        <span style="color: #64748b; font-size: 12px;">{{ email }}</span>
      </div>
    </div>
  `,
})
export class UserCellRenderer implements ICellRendererAngularComp {
  name = '';
  email = '';
  initials = '';
  avatarColor = '';
  role = '';

  agInit(params: ICellRendererParams): void {
    const user = params.value;
    if (user) {
      /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- empty strings from the API should also fall back to these defaults */
      this.name = user.name || 'System';
      this.email = user.email || 'system@app.com';
      this.initials = user.initials || 'SY';
      this.avatarColor = user.avatar_color || '#94a3b8';
      this.role = user.role || 'Admin';
      /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
    } else {
      this.name = 'System';
      this.email = 'system@app.com';
      this.initials = 'SY';
      this.avatarColor = '#94a3b8';
      this.role = 'Admin';
    }
  }

  refresh(): boolean {
    return false;
  }
}
