import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-user-status-badge',
  standalone: true,
  imports: [],
  templateUrl: './user-status-badge.component.html',
  styleUrl: './user-status-badge.component.scss',
})
export class UserStatusBadgeComponent {
  @Input() status: 'active' | 'inactive' | 'pending' = 'active';
}
