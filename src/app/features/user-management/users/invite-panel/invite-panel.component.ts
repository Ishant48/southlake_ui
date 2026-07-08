import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Role } from '../../models/role.model';
import { UsersApi } from '../../services/users-api';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-invite-panel',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './invite-panel.component.html',
  styleUrl: './invite-panel.component.scss',
})
export class InvitePanelComponent implements OnChanges {
  @Input() open = false;
  @Input() roles: Role[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() invited = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private usersService = inject(UsersApi);
  private toast = inject(ToastService);

  loading = false;
  errorMsg = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    name: ['', Validators.required],
    role_id: ['', Validators.required],
    user_type: ['', Validators.required],
    department: [''],
    title: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && !changes['open'].firstChange) {
      this.errorMsg = '';
      Promise.resolve().then(() => {
        this.form.patchValue({
          email: '',
          name: '',
          role_id: '',
          user_type: '',
          department: '',
          title: '',
        });
      });
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  closePanel(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMsg = '';

    const val = this.form.value;
    this.usersService
      .inviteUser({
        email: val.email as string,
        name: val.name as string,
        role_id: val.role_id as string,
        user_type: val.user_type as string,
        department: val.department ?? undefined,
        title: val.title ?? undefined,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.toast.success(`Invitation sent to ${val.email}`);
          this.form.reset({
            email: '',
            name: '',
            role_id: '',
            user_type: '',
            department: '',
            title: '',
          });
          this.invited.emit();
          this.closed.emit();
        },
        error: err => {
          this.loading = false;
          this.errorMsg = err?.error?.message ?? 'Failed to send invitation. Please try again.';
        },
      });
  }
}
