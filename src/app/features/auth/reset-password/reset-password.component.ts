import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group(
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

  token: string | null = null;
  validating = true;
  tokenValid = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (!token) {
        this.validating = false;
        this.tokenValid = false;
        return;
      }
      this.token = token;
      this.validateToken(token);
    });
  }

  private validateToken(token: string): void {
    this.validating = true;
    this.auth.validateResetToken(token).subscribe({
      next: () => {
        this.validating = false;
        this.tokenValid = true;
      },
      error: () => {
        this.validating = false;
        this.tokenValid = false;
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading || !this.token) return;
    this.loading = true;
    this.errorMsg = '';
    const password = this.form.value.password as string;

    this.auth.resetPassword(this.token, password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/login']);
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message ?? 'Failed to reset password. Please try again.';
      },
    });
  }
}
