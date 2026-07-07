import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JournalEntryFormView } from './journal-entry-form-view';
import { JournalEntryFormRow } from '../../models/journal-entry.model';

describe('JournalEntryFormView', () => {
  let component: JournalEntryFormView;
  let fixture: ComponentFixture<JournalEntryFormView>;

  const row = (overrides: Partial<JournalEntryFormRow> = {}): JournalEntryFormRow => ({
    rowId: 'row_1',
    je_number: 1,
    description: '',
    coa_id: '',
    sub: '',
    debit: null,
    credit: null,
    date: '2026-01-01',
    dp: '',
    policy: '',
    memo: '',
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JournalEntryFormView],
    }).compileComponents();

    fixture = TestBed.createComponent(JournalEntryFormView);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('copies entries into localEntries on change', () => {
    const entries = [row({ rowId: 'a' }), row({ rowId: 'b' })];
    component.entries = entries;
    component.ngOnChanges({
      entries: {
        currentValue: entries,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.localEntries).toEqual(entries);
    expect(component.localEntries).not.toBe(entries);
  });

  it('adds two new rows carrying forward the previous row fields', () => {
    component.jeNumber = 5;
    component.localEntries = [row({ description: 'Rent', sub: 'S1', date: '2026-02-02' })];

    component.addRow();

    expect(component.localEntries.length).toBe(3);
    expect(component.localEntries[1].description).toBe('Rent');
    expect(component.localEntries[1].sub).toBe('S1');
    expect(component.localEntries[1].je_number).toBe(5);
  });

  it('duplicates a row immediately after the source row', () => {
    component.localEntries = [row({ rowId: 'a', description: 'First' }), row({ rowId: 'b' })];

    component.copyRow(0);

    expect(component.localEntries.length).toBe(3);
    expect(component.localEntries[1].description).toBe('First');
    expect(component.localEntries[1].rowId).not.toBe('a');
  });

  it('deletes a row, or clears the last remaining row instead of removing it', () => {
    component.localEntries = [row({ rowId: 'a' }), row({ rowId: 'b', description: 'Keep me' })];
    component.deleteRow(0);
    expect(component.localEntries.length).toBe(1);
    expect(component.localEntries[0].description).toBe('Keep me');

    component.deleteRow(0);
    expect(component.localEntries.length).toBe(1);
    expect(component.localEntries[0].description).toBe('');
  });

  it('computes totals and balanced state', () => {
    component.localEntries = [row({ debit: 100 }), row({ credit: 100 })];
    expect(component.totalDebits).toBe(100);
    expect(component.totalCredits).toBe(100);
    expect(component.difference).toBe(0);
    expect(component.isBalanced).toBe(true);
  });

  it('is not balanced when totals are zero', () => {
    component.localEntries = [row()];
    expect(component.isBalanced).toBe(false);
  });

  it('emits post with the current local entries', () => {
    const entries = [row({ rowId: 'a' })];
    component.localEntries = entries;
    const postSpy = vi.fn();
    component.post.subscribe(postSpy);

    component.submitPost();

    expect(postSpy).toHaveBeenCalledWith(entries);
  });

  it('emits cancelled when Back to List is clicked', () => {
    fixture.detectChanges();
    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    const backBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.btn-dark',
    ) as HTMLButtonElement;
    backBtn.click();

    expect(cancelledSpy).toHaveBeenCalled();
  });
});
