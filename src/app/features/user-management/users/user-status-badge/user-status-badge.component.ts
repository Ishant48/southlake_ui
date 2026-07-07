import { Component, Input } from '@angular/core';
import { UserStatus } from '../../models/user.model';

@Component({
  selector: 'app-user-status-badge',
  standalone: true,
  imports: [],
  templateUrl: './user-status-badge.component.html',
  styleUrl: './user-status-badge.component.scss',
})
export class UserStatusBadgeComponent {
  protected readonly UserStatus = UserStatus;

  @Input() status: UserStatus = UserStatus.Active;
}
