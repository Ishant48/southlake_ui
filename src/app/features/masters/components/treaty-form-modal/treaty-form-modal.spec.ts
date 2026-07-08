import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreatyFormModal } from './treaty-form-modal';
import { TreatyFormShape, createBlankTreatyForm } from '../../models/treaty-form.model';

describe('TreatyFormModal', () => {
  let component: TreatyFormModal;
  let fixture: ComponentFixture<TreatyFormModal>;

  const sample: TreatyFormShape = {
    ...createBlankTreatyForm(),
    id: 'treaty-1',
    treaty_code: 'TR-100',
    name: 'Casualty QS',
    mga_id: 'mga-1',
    policy_seq_prefix: '',
    policy_seq_start: null,
    claim_seq_prefix: '',
    claim_seq_start: null,
    ulae_type: '',
    ulae_basis: '',
    ulae_flat_amount: 0,
    lae_dcc_pct: 0,
    lae_aoe_pct: 0,
    carriers: [{ risk_company_id: 'rc-1', retention_pct: 100 }],
    reinsurers: [
      {
        reinsurer_id: 're-1',
        cession_pct: 50,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatyFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(TreatyFormModal);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    component.open = false;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.modal-overlay')).toBeNull();
  });

  it('patches the form and selection maps from inputs on change, cloning arrays', () => {
    const selectedStates = { s1: true };
    component.model = sample;
    component.selectedStates = selectedStates;
    component.ngOnChanges({
      model: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
      selectedStates: {
        currentValue: selectedStates,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.form.getRawValue()).toEqual(sample);
    expect(component.form.controls.carriers.value).not.toBe(sample.carriers);
    expect(component.form.controls.reinsurers.value).not.toBe(sample.reinsurers);
    expect(component.formSelectedStates).toEqual(selectedStates);
    expect(component.formSelectedStates).not.toBe(selectedStates);
  });

  it('adds and removes reinsurer rows', () => {
    component.model = { ...createBlankTreatyForm(), reinsurers: [] };
    component.ngOnChanges({
      model: {
        currentValue: component.model,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    component.addReinsurerRow();
    expect(component.form.controls.reinsurers.value).toEqual([
      {
        reinsurer_id: '',
        cession_pct: 100,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
    ]);

    component.addReinsurerRow();
    expect(component.form.controls.reinsurers.value).toEqual([
      {
        reinsurer_id: '',
        cession_pct: 100,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
      {
        reinsurer_id: '',
        cession_pct: 0,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
    ]);

    component.updateReinsurerCessionPct(0, { target: { value: '80' } } as unknown as Event);
    expect(component.form.controls.reinsurers.value).toEqual([
      {
        reinsurer_id: '',
        cession_pct: 80,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
      {
        reinsurer_id: '',
        cession_pct: 20,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
    ]);

    component.addReinsurerRow();
    expect(component.form.controls.reinsurers.value).toEqual([
      {
        reinsurer_id: '',
        cession_pct: 80,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
      {
        reinsurer_id: '',
        cession_pct: 20,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
      {
        reinsurer_id: '',
        cession_pct: 0,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
    ]);

    component.updateReinsurerCessionPct(1, { target: { value: '10' } } as unknown as Event);
    expect(component.form.controls.reinsurers.value).toEqual([
      {
        reinsurer_id: '',
        cession_pct: 80,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
      {
        reinsurer_id: '',
        cession_pct: 10,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
      {
        reinsurer_id: '',
        cession_pct: 10,
        state_id: null,
        broker_id: null,
        broker_comm_type: null,
      },
    ]);

    component.removeReinsurerRow(0);
    expect(component.form.controls.reinsurers.value.length).toBe(2);
  });

  it('emits save with the form value and selection maps when valid', () => {
    component.model = sample;
    component.ngOnChanges({
      model: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    component.formSelectedStates = { s1: true };
    component.formSelectedLobs = { l1: true };
    component.formSelectedCobs = { c1: true };
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith({
      form: component.form.getRawValue(),
      selectedStates: { s1: true },
      selectedLobs: { l1: true },
      selectedCobs: { c1: true },
    });
  });

  it('does not emit save when a required field is missing', () => {
    component.model = { ...sample, treaty_code: '' };
    component.ngOnChanges({
      model: {
        currentValue: component.model,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.submit();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('emits closed when the close button is clicked', () => {
    component.open = true;
    fixture.detectChanges();
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.panel-close',
    ) as HTMLButtonElement;
    closeBtn.click();

    expect(closedSpy).toHaveBeenCalled();
  });
});
