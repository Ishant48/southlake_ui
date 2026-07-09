import { TestBed } from '@angular/core/testing';
import { TreatyQuickAddState } from './treaty-quick-add-state';
import { describe, it, expect } from 'vitest';

describe('TreatyQuickAddState', () => {
  it('starts with no pending mga id and can be set/cleared', () => {
    const state = TestBed.inject(TreatyQuickAddState);
    expect(state.pendingMgaId).toBeNull();

    state.pendingMgaId = 'mga-1';
    expect(state.pendingMgaId).toBe('mga-1');

    state.pendingMgaId = null;
    expect(state.pendingMgaId).toBeNull();
  });
});
