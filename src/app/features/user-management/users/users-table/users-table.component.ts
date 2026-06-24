import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../../../core/models/user.model';
import { UserStatusBadgeComponent } from '../user-status-badge/user-status-badge.component';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [UserStatusBadgeComponent],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss',
})
export class UsersTableComponent {
  @Input() users: User[] = [];
  @Input() loading = false;
  @Input() showCheckboxes = true;

  @Output() viewUser = new EventEmitter<User>();
  @Output() editUser = new EventEmitter<User>();
  @Output() deactivateUser = new EventEmitter<User>();
  @Output() selectionChanged = new EventEmitter<string[]>();

  selectedIds = new Set<string>();
  skeletonRows = [1, 2, 3, 4, 5];

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  allSelected(): boolean {
    return this.users.length > 0 && this.users.every(u => this.selectedIds.has(u.id));
  }

  someSelected(): boolean {
    return this.selectedIds.size > 0 && !this.allSelected();
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.users.forEach(u => this.selectedIds.add(u.id));
    } else {
      this.selectedIds.clear();
    }
    this.selectionChanged.emit([...this.selectedIds]);
  }

  toggleUser(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.selectionChanged.emit([...this.selectedIds]);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Never';
    }
  }

  hexToRgba(hex: string | null | undefined, alpha: number): string {
    if (!hex || hex.length < 7) return `rgba(13,27,75,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
