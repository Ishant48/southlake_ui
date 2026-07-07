import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MastersGrid } from './masters-grid';

describe('MastersGrid', () => {
  let component: MastersGrid;
  let fixture: ComponentFixture<MastersGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MastersGrid],
    }).compileComponents();

    fixture = TestBed.createComponent(MastersGrid);
    component = fixture.componentInstance;
    component.gridOptions = {};
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('shows the loading state when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Loading master data');
  });

  it('shows the empty state when not loading and rowData is empty', () => {
    component.loading = false;
    component.rowData = [];
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No records found');
  });

  it('renders the grid when rowData has items', () => {
    component.loading = false;
    component.rowData = [{ id: 1 }];
    fixture.detectChanges();
    const grid = (fixture.nativeElement as HTMLElement).querySelector('ag-grid-angular');
    expect(grid).toBeTruthy();
  });
});
