import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { JournalEntriesComponent } from './journal-entries.component';

describe('JournalEntriesComponent', () => {
  let component: JournalEntriesComponent;
  let fixture: ComponentFixture<JournalEntriesComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JournalEntriesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JournalEntriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock = TestBed.inject(HttpTestingController);
    // ngOnInit's loadInitialData chains several nested HTTP calls (batches ->
    // mgas -> batches again, plus a parallel chart-of-accounts call); flush in a
    // loop since each flush can synchronously trigger the next request.
    let pending = httpMock.match(() => true);
    while (pending.length > 0) {
      pending.forEach(req => req.flush([]));
      pending = httpMock.match(() => true);
    }
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formatCurrency renders a USD-formatted string', () => {
    expect(component.formatCurrency(1234.5)).toBe('$1,234.50');
    expect(component.formatCurrency(null)).toBe('-');
    expect(component.formatCurrency('')).toBe('-');
  });

  it('createBlankRow builds a row with defaults and an incrementing rowId', () => {
    const row1 = component.createBlankRow();
    const row2 = component.createBlankRow();
    expect(row1.rowId).not.toBe(row2.rowId);
    expect(row1.debit).toBeNull();
    expect(row1.credit).toBeNull();
  });

  it('filterEntries filters allEntries by search term across multiple fields', () => {
    component.allEntries = [
      {
        id: '1',
        batch_id: 'b1',
        je_number: 1,
        description: 'Rent payment',
        coa_id: 'c1',
        date: '2026-06-01',
        created_at: '2026-06-01',
      },
      {
        id: '2',
        batch_id: 'b1',
        je_number: 2,
        description: 'Utilities',
        coa_id: 'c2',
        date: '2026-06-01',
        created_at: '2026-06-01',
      },
    ];
    component.entriesSearchTerm = 'rent';
    component.filterEntries();
    expect(component.filteredEntries.length).toBe(1);
    expect(component.filteredEntries[0].description).toBe('Rent payment');
  });
});
