import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SessionToken } from '../../../core/models/session.model';

@Component({
  selector: 'app-session-conflict',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './session-conflict.component.html',
  styleUrl: './session-conflict.component.scss',
})
export class SessionConflictComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  challengeToken = '';
  existingDevice: { label: string; ip: string; created_at: string } | null = null;
  loading = false;
  errorMsg = '';

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = (nav?.extras?.state ?? history.state) as Record<string, unknown>;
    const session = state?.['session'] as SessionToken | undefined;
    if (session?.challenge_token) {
      this.challengeToken = session.challenge_token;
      this.existingDevice = session.existing_device ?? null;
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  signInHere(): void {
    if (!this.challengeToken || this.loading) return;
    this.loading = true;
    this.errorMsg = '';
    this.auth.resolveChallenge(this.challengeToken, true).subscribe({
      next: session => {
        this.loading = false;
        this.auth.storeSession(session);
        this.router.navigate(['/user-management/users']);
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message ?? 'Failed to sign in. Please try again.';
      },
    });
  }
}
