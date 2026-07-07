import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarState {
  isCollapsed = signal(false);

  toggle(): void {
    this.isCollapsed.update(v => !v);
  }
}
