import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResetPasswordComponent } from './reset-password.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let router: Router;
  let httpMock: HttpTestingController;
  let queryParamsSubject: Observable<Record<string, string>>;

  function setup(queryParams: Record<string, string>): void {
    queryParamsSubject = of(queryParams);
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    setup({ token: 'tok-123' });
    httpMock.expectOne(`${environment.apiUrl}/auth/reset-password/validate?token=tok-123`).flush({
      valid: true,
    });
    expect(component).toBeTruthy();
  });

  it('shows the invalid-link state immediately when no token is present', () => {
    setup({});

    expect(component.validating).toBe(false);
    expect(component.tokenValid).toBe(false);
  });

  it('shows the password form when the token validates successfully', () => {
    setup({ token: 'tok-123' });

    const req = httpMock.expectOne(
      req => req.url === `${environment.apiUrl}/auth/reset-password/validate`,
    );
    expect(req.request.params.get('token')).toBe('tok-123');
    req.flush({ valid: true });

    expect(component.validating).toBe(false);
    expect(component.tokenValid).toBe(true);
  });

  it('shows the invalid-link state when the token is rejected (e.g. 404)', () => {
    setup({ token: 'expired-token' });

    const req = httpMock.expectOne(
      req => req.url === `${environment.apiUrl}/auth/reset-password/validate`,
    );
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(component.validating).toBe(false);
    expect(component.tokenValid).toBe(false);
  });

  it('blocks submission when passwords do not match or are too short', () => {
    setup({ token: 'tok-123' });
    httpMock
      .expectOne(`${environment.apiUrl}/auth/reset-password/validate?token=tok-123`)
      .flush({ valid: true });

    component.form.setValue({ password: 'short', confirmPassword: 'short' });
    expect(component.form.invalid).toBe(true);

    component.form.setValue({ password: 'password123', confirmPassword: 'different123' });
    expect(component.form.hasError('notSame')).toBe(true);
    expect(component.form.invalid).toBe(true);

    component.form.setValue({ password: 'password123', confirmPassword: 'password123' });
    expect(component.form.valid).toBe(true);
  });

  it('resets the password and navigates to /auth/login without storing a session', () => {
    setup({ token: 'tok-123' });
    httpMock
      .expectOne(`${environment.apiUrl}/auth/reset-password/validate?token=tok-123`)
      .flush({ valid: true });

    component.form.setValue({ password: 'password123', confirmPassword: 'password123' });
    const navigateSpy = vi.spyOn(router, 'navigate');
    const auth = TestBed.inject(AuthService);
    const storeSessionSpy = vi.spyOn(auth, 'storeSession');

    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
    expect(req.request.body).toEqual({ token: 'tok-123', password: 'password123' });
    req.flush({ message: 'Password updated.' });

    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    expect(storeSessionSpy).not.toHaveBeenCalled();
  });
});
