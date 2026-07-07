import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LockPeriodModal } from './lock-period-modal';

describe('LockPeriodModal', () => {
  let component: LockPeriodModal;
  let fixture: ComponentFixture<LockPeriodModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LockPeriodModal],
    }).compileComponents();

    fixture = TestBed.createComponent(LockPeriodModal);
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

  it('copies the period input into local periodValue on change', () => {
    component.period = 'June 2026';
    component.ngOnChanges({
      period: {
        currentValue: 'June 2026',
        previousValue: '',
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.periodValue).toBe('June 2026');
  });

  it('emits save with the current period value', () => {
    component.periodValue = 'July 2026';
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith('July 2026');
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
