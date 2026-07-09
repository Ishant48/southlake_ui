import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Role } from '../../../user-management/models/role.model';
import { UserType } from '../../../user-management/models/user.model';
import { UsersApi } from '../../../user-management/services/users-api';
import { RolesApi } from '../../../user-management/services/roles-api';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { MgaMaster } from '../../models/master.model';

function notBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'string' && value.trim().length === 0 ? { required: true } : null;
}

/** Add-user flow scoped to a single MGA: same shape as the global invite panel, but
 * user_type is pinned to MGA User and the invite is tagged to this MGA via
 * user_entity_type/user_entity_id so it only ever applies to this record. */
@Component({
  selector: 'app-mga-users-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './mga-users-panel.html',
  styleUrl: './mga-users-panel.scss',
})
export class MgaUsersPanel implements OnChanges {
  @Input() open = false;
  @Input() mga: MgaMaster | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() invited = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private usersService = inject(UsersApi);
  private rolesService = inject(RolesApi);
  private toast = inject(ToastService);

  roles: Role[] = [];
  loading = false;
  errorMsg = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    name: ['', [Validators.required, notBlankValidator]],
    role_id: ['', Validators.required],
    department: [''],
    title: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.errorMsg = '';
      this.form.reset({ email: '', name: '', role_id: '', department: '', title: '' });
      if (this.roles.length === 0) {
        this.rolesService.getRoles({ per_page: 100 }).subscribe(res => (this.roles = res.data));
      }
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
    if (this.form.invalid || this.loading || !this.mga) return;
    this.loading = true;
    this.errorMsg = '';

    const val = this.form.value;
    this.usersService
      .inviteUser({
        email: val.email as string,
        name: val.name as string,
        role_id: val.role_id as string,
        user_type: UserType.MgaUser,
        department: val.department ?? undefined,
        title: val.title ?? undefined,
        user_entity_type: UserType.MgaUser,
        user_entity_id: this.mga.id,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.toast.success(`Invitation sent to ${val.email}`);
          this.form.reset({ email: '', name: '', role_id: '', department: '', title: '' });
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
