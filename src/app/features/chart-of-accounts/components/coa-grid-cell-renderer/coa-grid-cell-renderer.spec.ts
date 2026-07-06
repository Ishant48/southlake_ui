import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoaGridCellRenderer, CoaGridCellRendererParams } from './coa-grid-cell-renderer';

describe('CoaGridCellRenderer', () => {
  let component: CoaGridCellRenderer;
  let fixture: ComponentFixture<CoaGridCellRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoaGridCellRenderer],
    }).compileComponents();

    fixture = TestBed.createComponent(CoaGridCellRenderer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the badge variant based on is_root', () => {
    component.agInit({
      variant: 'badge',
      data: { is_root: true },
    } as unknown as CoaGridCellRendererParams);
    expect(component.isRoot).toBe(true);
  });

  it('renders the tree-name variant fields', () => {
    component.agInit({
      variant: 'tree-name',
      data: { treeDepth: 2, description: 'Cash', notes: 'Liquid asset', is_root: false },
    } as unknown as CoaGridCellRendererParams);

    expect(component.treeDepth).toBe(2);
    expect(component.description).toBe('Cash');
    expect(component.notes).toBe('Liquid asset');
  });

  it('renders the balance-badge variant field', () => {
    component.agInit({
      variant: 'balance-badge',
      data: { normal_balance: 'debit' },
    } as unknown as CoaGridCellRendererParams);
    expect(component.balance).toBe('debit');
  });

  it('refresh re-reads row data and reports success', () => {
    component.agInit({
      variant: 'badge',
      data: { is_root: false },
    } as unknown as CoaGridCellRendererParams);
    const result = component.refresh({
      variant: 'badge',
      data: { is_root: true },
    } as unknown as CoaGridCellRendererParams);

    expect(result).toBe(true);
    expect(component.isRoot).toBe(true);
  });

  it('actions variant delegates to the grid context parent handlers', () => {
    const openViewModal = vi.fn();
    const openDocModal = vi.fn();
    const openNotesModal = vi.fn();
    const openEditModal = vi.fn();
    const data = { id: 1 };
    component.agInit({
      variant: 'actions',
      data,
      context: { componentParent: { openViewModal, openDocModal, openNotesModal, openEditModal } },
    } as unknown as CoaGridCellRendererParams);

    const event = new MouseEvent('click');
    vi.spyOn(event, 'stopPropagation');

    component.onView(event);
    component.onDocument(event);
    component.onNotes(event);
    component.onEdit(event);

    expect(event.stopPropagation).toHaveBeenCalledTimes(4);
    expect(openViewModal).toHaveBeenCalledWith(data);
    expect(openDocModal).toHaveBeenCalledWith(data);
    expect(openNotesModal).toHaveBeenCalledWith(data);
    expect(openEditModal).toHaveBeenCalledWith(data);
  });
});
