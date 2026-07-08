import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-activity-summary-cards',
  standalone: true,
  templateUrl: './activity-summary-cards.html',
  styleUrl: './activity-summary-cards.scss',
})
export class ActivitySummaryCardsComponent implements OnChanges {
  @Input() stats: {
    total: number;
    successful: number;
    failed: number;
    critical: number;
    active_users: number;
  } | null = null;

  cards: any[] = [];

  constructor() {
    this.updateCards();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats']) {
      this.updateCards();
    }
  }

  private updateCards(): void {
    const stats = this.stats || {
      total: 0,
      successful: 0,
      failed: 0,
      critical: 0,
      active_users: 0,
    };

    const successRate = stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 100;

    this.cards = [
      {
        title: 'Total Activities',
        value: stats.total.toLocaleString(),
        subtitle: 'All recorded actions',
        icon: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M13 2v7h7',
        color: '#3b82f6',
        bg: '#eff6ff',
      },
      {
        title: 'Successful Actions',
        value: stats.successful.toLocaleString(),
        subtitle: `${successRate}% success rate`,
        icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3',
        color: '#10b981',
        bg: '#ecfdf5',
      },
      {
        title: 'Failed Actions',
        value: stats.failed.toLocaleString(),
        subtitle: 'Requires attention',
        icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
        color: '#f59e0b',
        bg: '#fffbeb',
      },
      {
        title: 'Critical Events',
        value: stats.critical.toLocaleString(),
        subtitle: 'Security & Auth',
        icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
        color: '#ef4444',
        bg: '#fef2f2',
      },
      {
        title: 'Active Users Today',
        value: stats.active_users.toLocaleString(),
        subtitle: 'Across all modules',
        icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
        color: '#8b5cf6',
        bg: '#f5f3ff',
      },
    ];
  }
}
