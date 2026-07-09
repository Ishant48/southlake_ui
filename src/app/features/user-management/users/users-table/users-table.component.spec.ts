import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { UsersTableComponent } from './users-table.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ActionButtonConfig } from '../../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { User, UserStatus, UserType } from '../../models/user.model';

describe('UsersTableComponent', () => {
  let component: UsersTableComponent;
  let fixture: ComponentFixture<UsersTableComponent>;
  let authService: {
    hasPermission: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };

  const otherUser: User = {
    id: 'u-1',
    email: 'other@example.com',
    name: 'Other User',
    user_type: UserType.Staff,
    status: UserStatus.Active,
    initials: 'OU',
    avatar_color: '#000',
  };

  function actionsForRow(user: User): ActionButtonConfig[] {
    const actionsCol = component.columnDefs.find(col => col.headerName === 'ACTIONS');
    const buttonsFn = actionsCol?.cellRendererParams?.buttons;
    return typeof buttonsFn === 'function' ? buttonsFn(user) : [];
  }

  function createComponent(): void {
    authService = {
      hasPermission: vi.fn().mockReturnValue(false),
      getCurrentUser: vi.fn().mockReturnValue({ email: 'me@example.com' }),
    };

    TestBed.configureTestingModule({
      imports: [UsersTableComponent],
      providers: [{ provide: AuthService, useValue: authService }],
    });

    fixture = TestBed.createComponent(UsersTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    createComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hides Reset Password without user.edit permission', () => {
    authService.hasPermission.mockReturnValue(false);
    const actions = actionsForRow(otherUser);
    expect(actions.some(a => a.action === 'reset-password')).toBe(false);
  });

  it('shows Reset Password with user.edit permission for another user', () => {
    authService.hasPermission.mockReturnValue(true);
    const actions = actionsForRow(otherUser);
    expect(actions.some(a => a.action === 'reset-password')).toBe(true);
  });

  it('hides Reset Password for the currently logged-in user', () => {
    authService.hasPermission.mockReturnValue(true);
    const actions = actionsForRow({ ...otherUser, email: 'me@example.com' });
    expect(actions.some(a => a.action === 'reset-password')).toBe(false);
  });

  it('emits resetPasswordUser when the action is clicked', () => {
    authService.hasPermission.mockReturnValue(true);
    const actionsCol = component.columnDefs.find(col => col.headerName === 'ACTIONS');
    const onClick = actionsCol?.cellRendererParams?.onClick;
    const emitSpy = vi.spyOn(component.resetPasswordUser, 'emit');
    onClick?.('reset-password', otherUser);
    expect(emitSpy).toHaveBeenCalledWith(otherUser);
  });
});
