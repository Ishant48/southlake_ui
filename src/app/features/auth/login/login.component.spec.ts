import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
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

  it('navigates to /dashboard after successfully accepting an invite', () => {
    component.inviteToken = 'invite-token';
    component.inviteForm.setValue({ password: 'password123', confirmPassword: 'password123' });
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.onAcceptInviteSubmit();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/accept-invite`);
    req.flush({
      token_type: 'session',
      session_token: 'tok',
      user: { id: 'u1', name: 'User', email: 'user@example.com', role: 'staff' },
    });

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });
});
