import { describe, it, expect } from 'vitest';
import {
  buildBlankTreatyForm,
  buildTreatyEditState,
  buildTreatyPayload,
} from './treaty-selection.util';
import { Treaty } from '../../models/master.model';

describe('treaty-selection.util', () => {
  it('builds a blank treaty form with an optional pre-selected mga_id', () => {
    const { form, selectedStates, selectedLobs, selectedCobs } = buildBlankTreatyForm('mga-1');
    expect(form.mga_id).toBe('mga-1');
    expect(form.carriers).toEqual([{ risk_company_id: '', retention_pct: 100 }]);
    expect(selectedStates).toEqual({});
    expect(selectedLobs).toEqual({});
    expect(selectedCobs).toEqual({});
  });

  it('builds edit state from a treaty with nested carriers/reinsurers/states/lobs', () => {
    const treaty: Partial<Treaty> = {
      id: 't-1',
      treaty_code: 'TR-1',
      name: 'Test Treaty',
      mga_id: 'mga-1',
      treaty_carriers: [{ risk_company_id: 'rc-1', retention_pct: 80 } as never],
      treaty_reinsurers: [{ reinsurer_id: 're-1', cession_pct: 50 } as never],
      treaty_states: [{ state_id: 's-1' } as never],
      treaty_lobs: [{ lob_id: 'l-1', treaty_lob_cobs: [{ cob_id: 'c-1' } as never] } as never],
    };

    const { form, selectedStates, selectedLobs, selectedCobs } = buildTreatyEditState(
      treaty as Treaty,
    );

    expect(form.carriers).toEqual([{ risk_company_id: 'rc-1', retention_pct: 80 }]);
    expect(form.reinsurers).toEqual([
      {
        reinsurer_id: 're-1',
        cession_pct: 50,
        state_id: null,
        state_ids: [],
        broker_id: null,
        broker_comm_type: null,
      },
    ]);
    expect(selectedStates).toEqual({ 's-1': true });
    expect(selectedLobs).toEqual({ 'l-1': true });
    expect(selectedCobs).toEqual({ 'c-1': true });
  });

  it('builds a create/update payload from the form and selection maps', () => {
    const { form } = buildBlankTreatyForm('mga-1');
    form.treaty_code = 'TR-1';
    form.name = 'Test';
    form.carriers = [{ risk_company_id: 'rc-1', retention_pct: 100 }];

    const payload = buildTreatyPayload(
      form,
      { 's-1': true, 's-2': false },
      { 'l-1': true },
      {
        'c-1': true,
      },
    );

    expect(payload.state_ids).toEqual(['s-1']);
    expect(payload.lobs).toEqual([{ lob_id: 'l-1', cob_ids: ['c-1'] }]);
    expect(payload.mga_id).toBe('mga-1');
    expect((payload as unknown as { mga_ids: string[] }).mga_ids).toEqual(['mga-1']);
  });
});
