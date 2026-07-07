import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GljeTab, GljeRow, GljeAmountField } from './glje-tab';

describe('GljeTab', () => {
  let component: GljeTab;
  let fixture: ComponentFixture<GljeTab>;

  const row = (overrides: Partial<GljeRow> = {}): GljeRow => ({
    desc: '',
    comp: '',
    account: '',
    cc: '',
    mga: '',
    lob: '',
    st: '',
    ext: '',
    sub: '',
    debit: null,
    credit: null,
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GljeTab],
    }).compileComponents();

    fixture = TestBed.createComponent(GljeTab);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('copies rows into localRows on change', () => {
    const rows = [row({ desc: 'A' })];
    component.rows = rows;
    component.ngOnChanges({
      rows: {
        currentValue: rows,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.localRows).toEqual(rows);
    expect(component.localRows).not.toBe(rows);
  });

  it('addRow appends a new row using the configured defaults and selected state, and emits the change', () => {
    component.rowDefaults = { comp: 'C1', cc: 'CC1', mga: 'M1', lob: 'L1', ext: 'E1', sub: 'S1' };
    component.selectedState = 'TX';
    component.localRows = [];
    const changedSpy = vi.fn();
    component.rowsChanged.subscribe(changedSpy);

    component.addRow();

    expect(component.localRows.length).toBe(1);
    expect(component.localRows[0]).toMatchObject({
      comp: 'C1',
      cc: 'CC1',
      mga: 'M1',
      lob: 'L1',
      ext: 'E1',
      sub: 'S1',
      st: 'TX',
      isNew: true,
    });
    expect(changedSpy).toHaveBeenCalledWith(component.localRows);
  });

  it('addRow uses "00" for the state code when TOTAL is selected', () => {
    component.selectedState = 'TOTAL';
    component.localRows = [];
    component.addRow();
    expect(component.localRows[0].st).toBe('00');
  });

  it('removeRow drops the row at the given index and emits the change', () => {
    component.localRows = [row({ desc: 'A' }), row({ desc: 'B' })];
    const changedSpy = vi.fn();
    component.rowsChanged.subscribe(changedSpy);

    component.removeRow(0);

    expect(component.localRows.length).toBe(1);
    expect(component.localRows[0].desc).toBe('B');
    expect(changedSpy).toHaveBeenCalled();
  });

  it('onRowAmountChange zeroes out the opposite field', () => {
    const r = row({ debit: 100, credit: 0 });
    component.localRows = [r];

    component.onRowAmountChange(r, GljeAmountField.Debit);
    expect(r.credit).toBe(0);

    r.debit = 0;
    r.credit = 50;
    component.onRowAmountChange(r, GljeAmountField.Credit);
    expect(r.debit).toBe(0);
  });

  it('formatCurrency formats values and falls back to "-"', () => {
    expect(component.formatCurrency(500)).toBe('$500.00');
    expect(component.formatCurrency(null)).toBe('-');
  });

  it('emits post and exportCsv when their buttons are clicked', () => {
    fixture.detectChanges();
    const postSpy = vi.fn();
    const exportSpy = vi.fn();
    component.post.subscribe(postSpy);
    component.exportCsv.subscribe(exportSpy);

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('.export-bar button');
    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();

    expect(postSpy).toHaveBeenCalled();
    expect(exportSpy).toHaveBeenCalled();
  });
});
