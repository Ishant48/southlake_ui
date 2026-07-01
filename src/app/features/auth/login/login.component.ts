import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
export class LoginComponent implements OnInit {
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
    console.log('LoginComponent: ngOnInit called');
    this.route.queryParams.subscribe(params => {
      console.log('LoginComponent: queryParams emitted:', params);
      const token = params['token'];
      if (token) {
        if (this.inviteToken === token && this.isInviteFlow) {
          console.log('LoginComponent: Token already processed, ignoring emission');
          return;
        }
        this.inviteToken = token;
        this.isInviteFlow = true;
        this.loadInviteDetails(token);
      }
    });
  }

  loadInviteDetails(token: string): void {
    console.log('LoginComponent: loadInviteDetails called with token:', token);
    this.inviteLoading = true;
    this.inviteError = '';
    this.auth.getInviteDetails(token).subscribe({
      next: details => {
        console.log('LoginComponent: loadInviteDetails success:', details);
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
}
