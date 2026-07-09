import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivityLog } from '../../models/activity-log.model';

@Component({
  selector: 'app-activity-drawer',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './activity-drawer.html',
  styleUrl: './activity-drawer.scss',
})
export class ActivityDrawerComponent {
  @Input() log!: ActivityLog;
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();

  close() {
    this.closeDrawer.emit();
  }

  getActionStyle(action: string): { bg: string; text: string } {
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
    return ACTION_COLORS[action.toLowerCase()] ?? { bg: 'rgba(13,27,75,0.08)', text: '#0d1b4b' };
  }

  getStatusStyle(status?: string): { bg: string; text: string } {
    const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
      success: { bg: '#ecfdf5', text: '#10b981' },
      failed: { bg: '#fef2f2', text: '#ef4444' },
      pending: { bg: '#fffbeb', text: '#f59e0b' },
      critical: { bg: '#fee2e2', text: '#b91c1c' },
    };
    return STATUS_COLORS[(status ?? '').toLowerCase()] ?? { bg: '#f1f5f9', text: '#64748b' };
  }

  formatAction(action: string): string {
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
    return ACTION_MAP[action.toLowerCase()] ?? action.charAt(0).toUpperCase() + action.slice(1);
  }

  formatModule(moduleId?: string): string {
    if (!moduleId) return '-';
    const MAP: Record<string, string> = {
      reports: 'Dashboard',
      user: 'Users',
      role: 'Roles & Permissions',
      permission: 'Roles & Permissions',
      user_management: 'Users',
      activity_log: 'Activity Logs',
      chart_of_accounts: 'Chart of Accounts',
      gl_mapping: 'GL Mappings',
      journal_entry: 'Journal Entries',
      workbook: 'Premium & Claims Exhibits',
      test_balance: 'Test Balance',
      treaty: 'Treaties',
      mga: 'MGAs',
      lob: 'Lines of Business',
      cob: 'Classes of Business',
      state: 'States',
      reinsurer: 'Reinsurers',
      risk_company: 'Carriers',
      broker: 'Brokers',
      product: 'Products',
      masters_config: 'Masters Configuration',
      database_seeder: 'Database Seeder',
    };
    return MAP[moduleId] ?? moduleId;
  }
}
