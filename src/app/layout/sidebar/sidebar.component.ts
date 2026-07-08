import { Component, inject, OnInit, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { SidebarState } from '../state/sidebar.state';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  sidebarService = inject(SidebarState);

  dashboardExpanded = true;
  accountingExpanded = false;
  adminExpanded = false;
  mastersExpanded = false;

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      if (!this.sidebarService.isCollapsed()) {
        this.sidebarService.isCollapsed.set(true);
      }
    }
  }

  get displayName(): string {
    return this.authService.getCurrentUser()?.name ?? 'User';
  }

  get userRole(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return 'User';
    const roleObj = user.role;
    if (typeof roleObj === 'string') {
      return roleObj;
    }
    return roleObj?.label ?? roleObj?.name ?? 'User';
  }

  get initials(): string {
    const name = this.displayName;
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  hasPermission(module: string, action: string): boolean {
    return this.authService.hasPermission(module, action);
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.checkActiveRoute(this.router.url);

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      const navEvent = event as NavigationEnd;
      this.checkActiveRoute(navEvent.urlAfterRedirects || navEvent.url);
    });
  }

  private checkActiveRoute(url: string): void {
    if (url.includes('/dashboard')) {
      this.dashboardExpanded = true;
    }
    if (
      url.includes('/chart-of-accounts') ||
      url.includes('/journal-entries') ||
      url.includes('/test-balance') ||
      url.includes('/reinsurance-calculations')
    ) {
      this.accountingExpanded = true;
    }
    if (url.includes('/user-management')) {
      this.adminExpanded = true;
    }
    if (url.includes('/masters')) {
      this.mastersExpanded = true;
    }
  }

  toggleDashboard(event: Event): void {
    event.preventDefault();
    if (this.sidebarService.isCollapsed()) {
      this.sidebarService.isCollapsed.set(false);
      this.dashboardExpanded = true;
      return;
    }
    this.dashboardExpanded = !this.dashboardExpanded;
  }

  toggleAccounting(event: Event): void {
    event.preventDefault();
    if (this.sidebarService.isCollapsed()) {
      this.sidebarService.isCollapsed.set(false);
      this.accountingExpanded = true;
      return;
    }
    this.accountingExpanded = !this.accountingExpanded;
  }

  toggleAdmin(event: Event): void {
    event.preventDefault();
    if (this.sidebarService.isCollapsed()) {
      this.sidebarService.isCollapsed.set(false);
      this.adminExpanded = true;
      return;
    }
    this.adminExpanded = !this.adminExpanded;
  }

  toggleMasters(event: Event): void {
    event.preventDefault();
    if (this.sidebarService.isCollapsed()) {
      this.sidebarService.isCollapsed.set(false);
      this.mastersExpanded = true;
      return;
    }
    this.mastersExpanded = !this.mastersExpanded;
  }

  signOut(event: Event): void {
    event.stopPropagation();
    this.authService.logout();
  }
}
