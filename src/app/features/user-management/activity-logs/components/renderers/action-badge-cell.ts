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
    const rawAction = params.value || '';

    const ACTION_MAP: Record<string, string> = {
      login: 'Login',
      logout: 'Logout',
      create: 'Create',
      update: 'Update',
      edit: 'Update',
      delete: 'Delete',
      otp_requested: 'Request OTP',
      session_conflict_detected: 'Conflict Detected',
      session_conflict_accepted: 'Conflict Accepted',
      session_conflict_rejected: 'Conflict Rejected',
      invite_accepted: 'Invite Accepted',
      session_expired: 'Session Expired',
      unlock_account: 'Unlock Account',
      approve: 'Approve',
    };

    this.action = ACTION_MAP[rawAction.toLowerCase()] ?? (rawAction.charAt(0).toUpperCase() + rawAction.slice(1));

    const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
      login: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' }, // Blue
      logout: { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748b' }, // Grey
      create: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981' }, // Green
      update: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' }, // Orange
      edit: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b' }, // Orange
      delete: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' }, // Red
      otp_requested: { bg: 'rgba(124, 58, 237, 0.12)', text: '#7c3aed' }, // Purple
      session_expired: { bg: 'rgba(100, 116, 139, 0.12)', text: '#64748b' }, // Grey
      unlock_account: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981' }, // Green
      approve: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981' }, // Green
    };

    const style = ACTION_COLORS[rawAction.toLowerCase()] ?? {
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
