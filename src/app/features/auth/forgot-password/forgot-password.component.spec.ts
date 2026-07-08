import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the form invalid until a valid email is entered', () => {
    expect(component.form.invalid).toBe(true);

    component.form.setValue({ email: 'not-an-email' });
    expect(component.form.invalid).toBe(true);

    component.form.setValue({ email: 'user@example.com' });
    expect(component.form.valid).toBe(true);
  });

  it('shows the generic success panel after a successful submission', () => {
    component.form.setValue({ email: 'user@example.com' });

    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`);
    expect(req.request.body).toEqual({ email: 'user@example.com' });
    req.flush({ message: 'If that email exists, we have sent a reset link.' });

    expect(component.submitted).toBe(true);
  });

  it('also shows the generic success panel when the request errors, never leaking account existence', () => {
    component.form.setValue({ email: 'user@example.com' });

    component.onSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`);
    req.flush('Server error', { status: 500, statusText: 'Server Error' });

    expect(component.submitted).toBe(true);
  });
});
