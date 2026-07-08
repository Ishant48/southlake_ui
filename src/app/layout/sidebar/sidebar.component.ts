import { Component, inject, OnInit, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { SidebarState } from '../state/sidebar.state';
import { NavGroup } from '../../core/models/nav.model';
import { NavIconComponent } from './nav-icon/nav-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NavIconComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  sidebarService = inject(SidebarState);

  navGroups: NavGroup[] = [];
  dashboardExpanded = true;
  private expandedGroups = new Set<string>();

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
    this.loadNavGroups();

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      const navEvent = event as NavigationEnd;
      this.checkActiveRoute(navEvent.urlAfterRedirects || navEvent.url);
    });
  }

  private loadNavGroups(): void {
    this.authService.getMyModules().subscribe({
      next: groups => {
        this.navGroups = groups;
        this.checkActiveRoute(this.router.url);
      },
      error: () => {
        this.navGroups = [];
      },
    });
  }

  isExpanded(groupId: string): boolean {
    return this.expandedGroups.has(groupId);
  }

  toggleGroup(event: Event, groupId: string): void {
    event.preventDefault();
    if (this.sidebarService.isCollapsed()) {
      this.sidebarService.isCollapsed.set(false);
      this.expandedGroups.add(groupId);
      return;
    }
    if (this.expandedGroups.has(groupId)) {
      this.expandedGroups.delete(groupId);
    } else {
      this.expandedGroups.add(groupId);
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

  routePath(route: string | null): string {
    return route ? route.split('?')[0] : '';
  }

  routeQueryParams(route: string | null): Record<string, string> {
    if (!route?.includes('?')) return {};
    const qs = route.split('?')[1];
    return Object.fromEntries(new URLSearchParams(qs));
  }

  private checkActiveRoute(url: string): void {
    if (url.includes('/dashboard')) {
      this.dashboardExpanded = true;
    }
    for (const group of this.navGroups) {
      const matches =
        group.children.length > 0
          ? group.children.some(c => !!c.route && url.includes(this.routePath(c.route)))
          : !!group.route && url.includes(this.routePath(group.route));
      if (matches) {
        this.expandedGroups.add(group.id);
      }
    }
  }

  signOut(event: Event): void {
    event.stopPropagation();
    this.authService.logout();
  }
}
