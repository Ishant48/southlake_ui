import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TreatiesTab } from './treaties-tab';
import { environment } from '../../../../../environments/environment';

describe('TreatiesTab', () => {
  let component: TreatiesTab;
  let fixture: ComponentFixture<TreatiesTab>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatiesTab],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TreatiesTab);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads mga options and treaties on init', () => {
    component.ngOnInit();

    httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/mgas`).flush([]);
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/workbooks`).flush([]);
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/treaties`).flush([]);

    expect(component).toBeTruthy();
  });

  it('filters the current list by the selected mga', () => {
    component.treatiesState.treaties = [
      { id: 't-1', mga_id: 'mga-1' } as never,
      { id: 't-2', mga_id: 'mga-2' } as never,
    ];
    component.mgaFilter = 'mga-1';
    expect(component.currentList).toEqual([{ id: 't-1', mga_id: 'mga-1' }]);
  });

  it('does not submit when required fields are missing', () => {
    const { form, selectedStates, selectedLobs, selectedCobs } = component.treatyForm;
    component.submitTreaty({
      form: { ...form, treaty_code: '' },
      selectedStates,
      selectedLobs,
      selectedCobs,
    });
    httpMock.expectNone(r => r.url.includes('/masters/treaties'));
  });

  it('opens a confirm dialog before deleting a treaty', () => {
    component.deleteTreaty({ id: 't-1', treaty_code: 'TR-1' } as never);
    expect(component.confirmOpen).toBe(true);
    expect(component.confirmMessage).toContain('TR-1');
  });
});
