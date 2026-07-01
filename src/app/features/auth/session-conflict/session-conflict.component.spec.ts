import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionConflictComponent } from './session-conflict.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('SessionConflictComponent', () => {
  let component: SessionConflictComponent;
  let fixture: ComponentFixture<SessionConflictComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionConflictComponent],
      providers: [provideRouter([]), provideHttpClient()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionConflictComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
