import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICellRendererParams } from 'ag-grid-community';

import { StatusBadgeCell } from './status-badge-cell';

describe('StatusBadgeCell', () => {
  let component: StatusBadgeCell;
  let fixture: ComponentFixture<StatusBadgeCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeCell],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeCell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it.each([
    ['active', 'active', 'Active'],
    ['true', 'active', 'Active'],
    ['verified', 'verified', 'Verified'],
    ['pending', 'pending', 'Pending'],
    ['unverified', 'pending', 'Unverified'],
    ['something-else', 'inactive', 'Inactive'],
  ])('maps value "%s" to badgeClass "%s" and text "%s"', (value, expectedClass, expectedText) => {
    const result = component.refresh({ value } as unknown as ICellRendererParams);

    expect(result).toBe(true);
    expect(component.badgeClass).toBe(expectedClass);
    expect(component.statusText).toBe(expectedText);
  });
});
