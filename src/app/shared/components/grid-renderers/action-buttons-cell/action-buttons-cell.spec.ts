import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionButtonsCell, ActionButtonsCellRendererParams } from './action-buttons-cell';

describe('ActionButtonsCell', () => {
  let component: ActionButtonsCell;
  let fixture: ComponentFixture<ActionButtonsCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionButtonsCell],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionButtonsCell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the provided static buttons array', () => {
    const buttons = [{ label: 'Edit', action: 'edit' }];
    component.agInit({ buttons, data: {} } as unknown as ActionButtonsCellRendererParams);
    expect(component.buttons).toEqual(buttons);
  });

  it('resolves a buttons factory function against row data', () => {
    const data = { locked: true };
    const factory = (rowData: unknown) =>
      (rowData as { locked: boolean }).locked
        ? [{ label: 'View', action: 'view' }]
        : [{ label: 'Edit', action: 'edit' }];
    component.agInit({ buttons: factory, data } as unknown as ActionButtonsCellRendererParams);
    expect(component.buttons).toEqual([{ label: 'View', action: 'view' }]);
  });

  it('falls back to a default edit button when none are provided', () => {
    component.agInit({
      buttons: undefined,
      data: {},
    } as unknown as ActionButtonsCellRendererParams);
    expect(component.buttons).toEqual([{ label: 'View / Edit', action: 'edit' }]);
  });

  it('invokes the onClick callback with the action and row data', () => {
    const onClick = vi.fn();
    const data = { id: 1 };
    component.agInit({
      buttons: [{ label: 'Edit', action: 'edit' }],
      data,
      onClick,
    } as unknown as ActionButtonsCellRendererParams);

    const event = new MouseEvent('click');
    vi.spyOn(event, 'stopPropagation');
    component.onClick('edit', event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledWith('edit', data);
  });

  it('identifies icon-only actions', () => {
    expect(component.isIconOnly('edit')).toBe(true);
    expect(component.isIconOnly('delete')).toBe(true);
    expect(component.isIconOnly('somethingElse')).toBe(false);
  });
});
