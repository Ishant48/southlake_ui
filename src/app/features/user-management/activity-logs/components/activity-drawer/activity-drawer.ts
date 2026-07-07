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
      login: { bg: 'var(--blue-bg, #eff6ff)', text: 'var(--blue, #3b82f6)' },
      logout: { bg: 'var(--gray-200, #e2e8f0)', text: 'var(--gray-600, #475569)' },
      create: { bg: 'var(--green-bg, #ecfdf5)', text: 'var(--green, #10b981)' },
      update: { bg: 'var(--orange-bg, #fffbeb)', text: 'var(--orange, #f59e0b)' },
      delete: { bg: 'var(--red-bg, #fef2f2)', text: 'var(--red, #ef4444)' },
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
    return STATUS_COLORS[(status || '').toLowerCase()] ?? { bg: '#f1f5f9', text: '#64748b' };
  }
}
