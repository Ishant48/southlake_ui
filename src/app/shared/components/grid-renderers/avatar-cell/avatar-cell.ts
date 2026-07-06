import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

export interface AvatarCellUser {
  name?: string;
  email?: string;
  initials?: string;
  avatar_color?: string;
}

export interface AvatarCellRendererParams extends Omit<ICellRendererParams, 'value' | 'data'> {
  value?: AvatarCellUser | string;
  data?: { user?: AvatarCellUser } & AvatarCellUser;
}

@Component({
  selector: 'app-avatar-cell',
  imports: [],
  templateUrl: './avatar-cell.html',
  styleUrl: './avatar-cell.scss',
})
export class AvatarCell implements ICellRendererAngularComp {
  initials = '';
  name = '';
  email = '';
  avatarColor = '#0f172a';

  agInit(params: AvatarCellRendererParams): void {
    this.refresh(params);
  }

  refresh(params: AvatarCellRendererParams): boolean {
    const user =
      (typeof params.value === 'string' ? undefined : params.value) ??
      params.data?.user ??
      params.data;
    if (user) {
      this.name = user.name ?? 'Unknown User';
      this.email = user.email ?? '';
      this.initials = user.initials ?? this.getInitials(this.name);
      this.avatarColor = user.avatar_color ?? '#0f172a';
    } else {
      this.name = typeof params.value === 'string' ? params.value : '';
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
