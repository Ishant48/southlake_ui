import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SessionToken } from '../../../core/models/session.model';

@Component({
  selector: 'app-session-conflict',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './session-conflict.component.html',
  styleUrl: './session-conflict.component.scss'
})
export class SessionConflictComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  challengeData: { session_id: string; device_label: string; ip_address: string; created_at: string } | null = null;
  loading = false;
  errorMsg = '';

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as Record<string, unknown> | null;
    const session = (state?.['session'] as SessionToken) ?? (history.state as Record<string, unknown>)?.['session'] as SessionToken;
    if (session?.challenge_data) {
      this.challengeData = session.challenge_data;
    }
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  signInHere(): void {
    if (!this.challengeData || this.loading) return;
    this.loading = true;
    this.errorMsg = '';
    this.auth.resolveChallenge(this.challengeData.session_id, true).subscribe({
      next: (session) => {
        this.loading = false;
        this.auth.storeSession(session);
        this.router.navigate(['/user-management/users']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message ?? 'Failed to sign in. Please try again.';
      }
    });
  }
}
