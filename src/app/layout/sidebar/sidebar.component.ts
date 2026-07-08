import { Component, inject, OnInit, HostListener, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { SidebarState } from '../state/sidebar.state';
import { SIDEBAR_CONFIG, SidebarSection } from './sidebar.config';

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

  readonly config = SIDEBAR_CONFIG;

  readonly visibleSections = computed(() => {
    const perms = this.authService.permissions();
    return this.config
      .map(section => ({
        ...section,
        visibleItems: section.items.filter(item =>
          !item.permission || perms.includes(`${item.permission.module}.${item.permission.action}`)
        ),
      }))
      .filter(section => section.visibleItems.length > 0);
  });

  sectionExpanded: Record<string, boolean> = {
    dashboard: true,
    accounting: false,
    admin: false,
    masters: false,
  };

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
      return roleObj === 'superadmin'
        ? 'Super Administrator'
        : roleObj === 'admin'
          ? 'Administrator'
          : roleObj;
    }
    const roleName = roleObj?.name ?? 'User';
    return roleName === 'superadmin'
      ? 'Super Administrator'
      : roleName === 'admin'
        ? 'Administrator'
        : roleName;
  }

  get initials(): string {
    const name = this.displayName;
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
      this.sectionExpanded['dashboard'] = true;
    }
    if (
      url.includes('/chart-of-accounts') ||
      url.includes('/journal-entries') ||
      url.includes('/test-balance') ||
      url.includes('/reinsurance-calculations')
    ) {
      this.sectionExpanded['accounting'] = true;
    }
    if (url.includes('/user-management')) {
      this.sectionExpanded['admin'] = true;
    }
    if (url.includes('/masters')) {
      this.sectionExpanded['masters'] = true;
    }
  }

  toggleSection(section: SidebarSection, event: Event): void {
    event.preventDefault();
    if (this.sidebarService.isCollapsed()) {
      this.sidebarService.isCollapsed.set(false);
      this.sectionExpanded[section.key] = true;
      return;
    }
    this.sectionExpanded[section.key] = !this.sectionExpanded[section.key];
  }

  signOut(event: Event): void {
    event.stopPropagation();
    this.authService.logout();
  }
}
