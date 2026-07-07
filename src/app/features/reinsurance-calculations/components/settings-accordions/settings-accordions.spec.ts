import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsAccordions } from './settings-accordions';

describe('SettingsAccordions', () => {
  let component: SettingsAccordions;
  let fixture: ComponentFixture<SettingsAccordions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsAccordions],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsAccordions);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('all accordions start collapsed', () => {
    expect(component.parametersExpanded).toBe(false);
    expect(component.ratesExpanded).toBe(false);
    expect(component.mappingsExpanded).toBe(false);
  });

  it('toggleAccordion flips only the targeted section', () => {
    component.toggleAccordion('parameters');
    expect(component.parametersExpanded).toBe(true);
    expect(component.ratesExpanded).toBe(false);
    expect(component.mappingsExpanded).toBe(false);

    component.toggleAccordion('rates');
    expect(component.ratesExpanded).toBe(true);

    component.toggleAccordion('parameters');
    expect(component.parametersExpanded).toBe(false);
  });

  it('renders no card body when collapsed', () => {
    fixture.detectChanges();
    const bodies = (fixture.nativeElement as HTMLElement).querySelectorAll('.card-body');
    expect(bodies.length).toBe(0);
  });

  it('renders the card body once its section is expanded', () => {
    component.toggleAccordion('mappings');
    fixture.detectChanges();
    const bodies = (fixture.nativeElement as HTMLElement).querySelectorAll('.card-body');
    expect(bodies.length).toBe(1);
  });
});
