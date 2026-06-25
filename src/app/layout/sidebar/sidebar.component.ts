import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';

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
  mastersExpanded = false;

  hasPermission(module: string, action: string): boolean {
    return this.authService.hasPermission(module, action);
  }

  ngOnInit(): void {
    // Auto-expand if currently on the masters page
    this.checkActiveRoute(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkActiveRoute(event.urlAfterRedirects || event.url);
    });
  }

  private checkActiveRoute(url: string): void {
    if (url.includes('/masters')) {
      this.mastersExpanded = true;
    }
  }

  toggleMasters(event: Event): void {
    event.preventDefault();
    this.mastersExpanded = !this.mastersExpanded;
  }
}
