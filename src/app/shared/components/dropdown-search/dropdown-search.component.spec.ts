import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownSearchComponent } from './dropdown-search.component';

describe('DropdownSearchComponent', () => {
  let component: DropdownSearchComponent;
  let fixture: ComponentFixture<DropdownSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownSearchComponent);
    component = fixture.componentInstance;
    component.items = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ];
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('positions the panel with position: fixed, computed from the trigger rect, so it is not clipped by a scrollable ancestor', () => {
    const trigger = (fixture.nativeElement as HTMLElement).querySelector(
      '.dropdown-search-trigger',
    ) as HTMLElement;
    trigger.click();
    fixture.detectChanges();

    const panel = (fixture.nativeElement as HTMLElement).querySelector(
      '.dropdown-search-panel',
    ) as HTMLElement;
    expect(panel).toBeTruthy();
    expect(component.panelStyle.top).toMatch(/px$/);
    expect(component.panelStyle.left).toMatch(/px$/);
    expect(component.panelStyle.width).toMatch(/px$/);
  });

  it('closes the dropdown when a scroll happens outside the panel (capture-phase, since scroll does not bubble)', () => {
    const trigger = (fixture.nativeElement as HTMLElement).querySelector(
      '.dropdown-search-trigger',
    ) as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    expect(component.isOpen).toBe(true);

    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    outsideEl.dispatchEvent(new Event('scroll', { bubbles: false }));

    expect(component.isOpen).toBe(false);
    document.body.removeChild(outsideEl);
  });

  it('toggling a multi-select item updates selectedValues and emits the change', () => {
    component.isMultiSelect = true;
    component.selectedValues = {};
    let emitted: Record<string, boolean> | undefined;
    component.selectedValuesChange.subscribe(v => (emitted = v));

    component.toggleMulti({ id: 'a', name: 'Alpha' });

    expect(component.selectedValues).toEqual({ a: true });
    expect(emitted).toEqual({ a: true });
  });
});
