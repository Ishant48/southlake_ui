import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleFormModal, SimpleFormValue, createBlankSimpleForm } from './simple-form-modal';

describe('SimpleFormModal', () => {
  let component: SimpleFormModal;
  let fixture: ComponentFixture<SimpleFormModal>;

  const sample: SimpleFormValue = {
    ...createBlankSimpleForm(),
    id: 'lob-1',
    code: 'TX',
    name: 'Texas',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(SimpleFormModal);
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

  it('copies the model into local formValue on change', () => {
    component.model = sample;
    component.ngOnChanges({
      model: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.formValue).toEqual(sample);
    expect(component.formValue).not.toBe(sample);
  });

  it('initializes lob_ids and cob_ids from model with selection map', () => {
    const model: SimpleFormValue = { ...createBlankSimpleForm(), lob_ids: ['l1', 'l2'], cob_ids: ['c1'] };
    component.model = model;
    component.ngOnChanges({
      model: {
        currentValue: model,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.formValue.lob_ids).toEqual(['l1', 'l2']);
    expect(component.formValue.cob_ids).toEqual(['c1']);
    expect(component.formSelectedLobIds).toEqual({ l1: true, l2: true });
    expect(component.formSelectedCobIds).toEqual({ c1: true });
  });

  it('emits save with the current form value', () => {
    component.model = sample;
    component.ngOnChanges({
      model: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith(sample);
  });

  it('emits closed when the close button is clicked', () => {
    component.open = true;
    fixture.detectChanges();
    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.panel-close',
    ) as HTMLButtonElement;
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    closeBtn.click();

    expect(closedSpy).toHaveBeenCalled();
  });
});
