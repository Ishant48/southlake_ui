import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OtpComponent } from './otp.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

describe('OtpComponent', () => {
  let component: OtpComponent;
  let fixture: ComponentFixture<OtpComponent>;
  let router: Router;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OtpComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates to /dashboard after a successful OTP verification', () => {
    component.email = 'user@example.com';
    component.digits = ['1', '2', '3', '4', '5', '6'];
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.submit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/verify-otp`);
    req.flush({
      token_type: 'session',
      session_token: 'tok',
      user: { id: 'u1', name: 'User', email: 'user@example.com', role: 'staff' },
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });
});
