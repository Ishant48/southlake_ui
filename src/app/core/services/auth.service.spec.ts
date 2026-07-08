import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function storeUser(user: Record<string, unknown>): void {
    service.storeSession({ user: user as never });
  }

  describe('hasPermission', () => {
    it('grants everything to a superadmin via the boolean flag, regardless of role name', () => {
      storeUser({
        is_super_admin: true,
        role: { name: 'some_custom_role', label: 'Custom' },
        permissions: [],
      });
      expect(service.hasPermission('user_management', 'view')).toBe(true);
      expect(service.hasPermission('anything.at.all')).toBe(true);
    });

    it('does not grant access purely from a role named superadmin without the boolean flag', () => {
      storeUser({
        is_super_admin: false,
        role: { name: 'superadmin', label: 'Super Admin' },
        permissions: [],
      });
      expect(service.hasPermission('user_management', 'view')).toBe(false);
    });

    it('checks the object-array permissions with the 1-argument signature', () => {
      storeUser({
        is_super_admin: false,
        role: { name: 'staff', label: 'Staff' },
        permissions: [{ id: 'p1', action: 'user.view' }],
      });
      expect(service.hasPermission('user.view')).toBe(true);
      expect(service.hasPermission('user.delete')).toBe(false);
    });

    it('checks the object-array permissions with the 2-argument (module, action) signature', () => {
      storeUser({
        is_super_admin: false,
        role: { name: 'staff', label: 'Staff' },
        permissions: [{ module_id: 'user_management', action: 'view' }],
      });
      expect(service.hasPermission('user_management', 'view')).toBe(true);
      expect(service.hasPermission('user_management', 'delete')).toBe(false);
    });

    it('returns false when there is no current user', () => {
      expect(service.hasPermission('user.view')).toBe(false);
    });

    it('returns false when permissions is missing entirely', () => {
      storeUser({ is_super_admin: false, role: { name: 'staff', label: 'Staff' } });
      expect(service.hasPermission('user.view')).toBe(false);
      expect(service.hasPermission('user_management', 'view')).toBe(false);
    });
  });

  describe('requestPasswordReset', () => {
    it('posts the email to /auth/forgot-password', () => {
      let result: { message: string } | undefined;
      service.requestPasswordReset('user@example.com').subscribe(res => (result = res));

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'user@example.com' });
      req.flush({ message: 'If that email exists, we have sent a reset link.' });

      expect(result?.message).toBeTruthy();
    });
  });

  describe('validateResetToken', () => {
    it('gets /auth/reset-password/validate with the token as a query param', () => {
      let result: { valid: boolean } | undefined;
      service.validateResetToken('tok-123').subscribe(res => (result = res));

      const req = httpMock.expectOne(
        req => req.url === `${environment.apiUrl}/auth/reset-password/validate`,
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('token')).toBe('tok-123');
      req.flush({ valid: true });

      expect(result).toEqual({ valid: true });
    });
  });

  describe('resetPassword', () => {
    it('posts the token and password to /auth/reset-password', () => {
      let result: { message: string } | undefined;
      service.resetPassword('tok-123', 'newpassword1').subscribe(res => (result = res));

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: 'tok-123', password: 'newpassword1' });
      req.flush({ message: 'Password updated.' });

      expect(result?.message).toBeTruthy();
    });
  });
});
