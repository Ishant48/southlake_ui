import { TestBed } from '@angular/core/testing';
import { SidebarState } from './sidebar.state';

describe('SidebarState', () => {
  let state: SidebarState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    state = TestBed.inject(SidebarState);
  });

  it('starts expanded (not collapsed)', () => {
    expect(state.isCollapsed()).toBe(false);
  });

  it('toggle flips the collapsed state', () => {
    state.toggle();
    expect(state.isCollapsed()).toBe(true);
    state.toggle();
    expect(state.isCollapsed()).toBe(false);
  });
});
