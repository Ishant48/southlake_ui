import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, OnDestroy {
  private autofillIntervalId: ReturnType<typeof setInterval> | undefined;
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  inviteForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: group => {
        const pass = group.get('password')?.value;
        const confirmPass = group.get('confirmPassword')?.value;
        return pass === confirmPass ? null : { notSame: true };
      },
    },
  );

  loading = false;
  errorMsg = '';
  showPassword = false;

  // Invite Flow State
  isInviteFlow = false;
  inviteToken: string | null = null;
  inviteLoading = false;
  inviteEmail = '';
  inviteName = '';
  inviteError = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        if (this.inviteToken === token && this.isInviteFlow) {
          return;
        }
        this.inviteToken = token;
        this.isInviteFlow = true;
        this.loadInviteDetails(token);
      }
    });

    // Start autofill detection interval to enable button when browser saves/autofills values
    this.autofillIntervalId = setInterval(() => {
      const emailEl = document.getElementById('email') as HTMLInputElement;
      const passwordEl = document.getElementById('password') as HTMLInputElement;
      let changed = false;

      if (emailEl?.value && this.form.get('email')?.value !== emailEl.value) {
        this.form.get('email')?.setValue(emailEl.value);
        this.form.get('email')?.markAsDirty();
        this.form.get('email')?.markAsTouched();
        changed = true;
      }
      if (passwordEl?.value && this.form.get('password')?.value !== passwordEl.value) {
        this.form.get('password')?.setValue(passwordEl.value);
        this.form.get('password')?.markAsDirty();
        this.form.get('password')?.markAsTouched();
        changed = true;
      }

      if (changed) {
        this.cdr.detectChanges();
      }
    }, 200);
  }

  loadInviteDetails(token: string): void {
    this.inviteLoading = true;
    this.inviteError = '';
    this.auth.getInviteDetails(token).subscribe({
      next: details => {
        this.inviteLoading = false;
        this.inviteEmail = details.email;
        this.inviteName = details.name;
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('LoginComponent: loadInviteDetails error:', err);
        this.inviteLoading = false;
        this.inviteError = err?.error?.message ?? 'The invitation is invalid or has expired.';
        this.cdr.markForCheck();
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMsg = '';
    const email = this.form.value.email as string;
    const password = this.form.value.password as string;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/otp'], { state: { email, password } });
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message ?? 'Invalid email or password.';
        this.cdr.markForCheck();
      },
    });
  }

  onAcceptInviteSubmit(): void {
    if (this.inviteForm.invalid || this.loading || !this.inviteToken) return;
    this.loading = true;
    this.errorMsg = '';
    const password = this.inviteForm.value.password as string;

    this.auth.acceptInvite(this.inviteToken, password).subscribe({
      next: res => {
        this.loading = false;
        this.auth.storeSession(res);
        this.router.navigate(['/user-management/users']);
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message ?? 'Failed to accept invitation. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.autofillIntervalId) {
      clearInterval(this.autofillIntervalId);
    }
  }
}
