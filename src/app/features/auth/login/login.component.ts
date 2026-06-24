import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loading = false;
  errorMsg = '';

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMsg = '';
    const email = this.form.value.email as string;

    this.auth.requestOtp(email).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/otp'], { state: { email } });
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message ?? 'Failed to send OTP. Please try again.';
      }
    });
  }
}
