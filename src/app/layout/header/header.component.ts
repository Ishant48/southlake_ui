import { Component, inject, HostListener } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { SidebarService } from '../../core/services/sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private auth = inject(AuthService);
  sidebarService = inject(SidebarService);
  dropdownOpen = false;

  get displayName(): string {
    return this.auth.getCurrentUser()?.name ?? 'User';
  }

  get userEmail(): string {
    return this.auth.getCurrentUser()?.email ?? '';
  }

  get initials(): string {
    const name = this.displayName;
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  get avatarColor(): string {
    return '#0d1b4b';
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  signOut(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = false;
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el.closest('.user-menu')) {
      this.dropdownOpen = false;
    }
  }
}
