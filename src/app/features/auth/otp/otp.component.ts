import {
  Component,
  inject,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
})
export class OtpComponent implements AfterViewInit {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private router = inject(Router);
  private auth = inject(AuthService);

  email = '';
  password = '';
  digits: string[] = ['', '', '', '', '', ''];
  loading = false;
  resending = false;
  errorMsg = '';

  constructor() {
    const nav = this.router.getCurrentNavigation();
    const navState = (nav?.extras?.state ?? history.state) as Record<string, string>;
    this.email = navState?.['email'] ?? '';
    this.password = navState?.['password'] ?? '';
    if (!this.email) {
      this.router.navigate(['/auth/login']);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const inputs = this.digitInputs.toArray();
      if (inputs.length > 0) {
        inputs[0].nativeElement.focus();
      }
    }, 100);
  }

  isComplete(): boolean {
    return this.digits.every(d => d.length === 1);
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const inputs = this.digitInputs.toArray();
    if (event.key === 'Backspace') {
      if (this.digits[index] === '') {
        if (index > 0) {
          this.digits[index - 1] = '';
          inputs[index - 1].nativeElement.focus();
        }
      } else {
        this.digits[index] = '';
        inputs[index].nativeElement.value = '';
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputs[index - 1].nativeElement.focus();
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && index < 5) {
      inputs[index + 1].nativeElement.focus();
      event.preventDefault();
    }
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = value;
    input.value = value;

    if (value && index < 5) {
      const inputs = this.digitInputs.toArray();
      inputs[index + 1].nativeElement.focus();
    }

    if (this.isComplete()) {
      setTimeout(() => this.submit(), 50);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') ?? '';
    const nums = text.replace(/\D/g, '').slice(0, 6);
    if (!nums) return;
    const inputs = this.digitInputs.toArray();
    for (let i = 0; i < 6; i++) {
      this.digits[i] = nums[i] ?? '';
      inputs[i].nativeElement.value = nums[i] ?? '';
    }
    const nextEmpty = nums.length < 6 ? nums.length : 5;
    inputs[nextEmpty].nativeElement.focus();
    if (this.isComplete()) {
      setTimeout(() => this.submit(), 50);
    }
  }

  submit(): void {
    if (!this.isComplete() || this.loading) return;
    this.loading = true;
    this.errorMsg = '';
    const otp = this.digits.join('');

    this.auth.verifyOtp(this.email, otp).subscribe({
      next: session => {
        this.loading = false;
        if (session.token_type === 'session') {
          this.auth.storeSession(session);
          this.router.navigate(['/user-management/users']);
        } else {
          this.router.navigate(['/auth/session-conflict'], {
            state: { session, email: this.email },
          });
        }
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message ?? 'Invalid or expired code. Please try again.';
        this.digits = ['', '', '', '', '', ''];
        const inputs = this.digitInputs.toArray();
        inputs.forEach(i => (i.nativeElement.value = ''));
        inputs[0].nativeElement.focus();
      },
    });
  }

  resend(): void {
    if (this.resending || !this.email || !this.password) return;
    this.resending = true;
    this.errorMsg = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.resending = false;
      },
      error: () => {
        this.resending = false;
      },
    });
  }
}
