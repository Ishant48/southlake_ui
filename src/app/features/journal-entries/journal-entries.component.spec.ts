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

  it('addRow copies the previous row values for the new rows', () => {
    component.formEntries = [component.createBlankRow({ description: 'Rent', sub: '705' })];
    component.addRow();
    expect(component.formEntries.length).toBe(3);
    expect(component.formEntries[1].description).toBe('Rent');
    expect(component.formEntries[1].sub).toBe('705');
  });

  it('copyRow duplicates a row immediately after the source', () => {
    component.formEntries = [component.createBlankRow({ description: 'Original' })];
    component.copyRow(0);
    expect(component.formEntries.length).toBe(2);
    expect(component.formEntries[1].description).toBe('Original');
  });

  it('deleteRow removes a row, or clears the last remaining row', () => {
    component.formEntries = [component.createBlankRow(), component.createBlankRow()];
    component.deleteRow(1);
    expect(component.formEntries.length).toBe(1);

    component.deleteRow(0);
    expect(component.formEntries.length).toBe(1);
    expect(component.formEntries[0].description).toBe('');
  });

  it('formTotalDebits/Credits and isFormBalanced compute correctly', () => {
    component.formEntries = [
      component.createBlankRow({ debit: 100, credit: null }),
      component.createBlankRow({ debit: null, credit: 100 }),
    ];
    expect(component.formTotalDebits).toBe(100);
    expect(component.formTotalCredits).toBe(100);
    expect(component.isFormBalanced).toBe(true);
  });

  it('isFormBalanced is false when there is a difference', () => {
    component.formEntries = [component.createBlankRow({ debit: 100, credit: null })];
    expect(component.isFormBalanced).toBe(false);
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
