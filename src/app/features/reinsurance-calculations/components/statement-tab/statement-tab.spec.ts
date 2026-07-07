import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatementTab } from './statement-tab';

describe('StatementTab', () => {
  let component: StatementTab;
  let fixture: ComponentFixture<StatementTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatementTab],
    }).compileComponents();

    fixture = TestBed.createComponent(StatementTab);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('formatCurrency formats positive and negative values, and falls back to "-"', () => {
    expect(component.formatCurrency(1234.5)).toBe('$1,234.50');
    expect(component.formatCurrency(-50)).toBe('-$50.00');
    expect(component.formatCurrency(null)).toBe('-');
    expect(component.formatCurrency('')).toBe('-');
    expect(component.formatCurrency('not-a-number')).toBe('-');
  });

  it('renders row labels and formatted values, blanking value for header rows', () => {
    component.rows = [
      { label: 'Section', isHeader: true },
      { label: 'Premiums Written', value: 1000, formula: 'PW' },
    ];
    fixture.detectChanges();

    const cells = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(cells.length).toBe(2);
    expect(cells[0].textContent).toContain('Section');
    expect(cells[1].textContent).toContain('$1,000.00');
    expect(cells[1].textContent).toContain('PW');
  });
});
