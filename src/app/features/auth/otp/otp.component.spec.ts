import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OtpComponent } from './otp.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('OtpComponent', () => {
  let component: OtpComponent;
  let fixture: ComponentFixture<OtpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(OtpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
