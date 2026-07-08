import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { UsersComponent } from './users.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { environment } from '../../../../environments/environment';
import { User, UserStatus, UserType } from '../models/user.model';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let httpMock: HttpTestingController;
  let toast: ToastService;

  const user: User = {
    id: 'u-1',
    email: 'other@example.com',
    name: 'Other User',
    user_type: UserType.Staff,
    status: UserStatus.Active,
    initials: 'OU',
    avatar_color: '#000',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersComponent, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();

    httpMock.match(() => true).forEach(req => req.flush({}));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens a confirmation dialog for resetting a password', () => {
    component.onResetPasswordUser(user);
    expect(component.confirmOpen).toBe(true);
    expect(component.confirmMessage).toContain(user.name);
  });

  it('sends the reset-password request and shows a success toast on confirm', () => {
    const successSpy = vi.spyOn(toast, 'success');
    component.onResetPasswordUser(user);
    component.onConfirmed();

    const req = httpMock.expectOne(`${environment.apiUrl}/users/${user.id}/reset-password`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Password reset email sent to the user.' });

    expect(successSpy).toHaveBeenCalledWith('Password reset email sent to the user.');
  });

  it('shows an error toast when the reset-password request fails', () => {
    const errorSpy = vi.spyOn(toast, 'error');
    component.onResetPasswordUser(user);
    component.onConfirmed();

    const req = httpMock.expectOne(`${environment.apiUrl}/users/${user.id}/reset-password`);
    req.flush(
      { message: 'Too many reset requests, try again later.' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(errorSpy).toHaveBeenCalledWith('Too many reset requests, try again later.');
  });
});
