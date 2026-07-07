import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RiskCompaniesTab } from './risk-companies-tab';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { RiskCompany } from '../../models/master.model';
import { environment } from '../../../../../environments/environment';

describe('RiskCompaniesTab', () => {
  let component: RiskCompaniesTab;
  let fixture: ComponentFixture<RiskCompaniesTab>;
  let httpMock: HttpTestingController;

  const sample: RiskCompany = {
    id: 'rc-1',
    risk_company_id: 'RC-1',
    company_id: 1,
    id_name: 'ACME',
    name: 'Acme Risk Co',
    phone: '555-1234',
    is_admitted: true,
    state: 'TX',
    address: '123 Main St',
    zip: '75001',
    city: 'Southlake',
    notes: 'Some notes',
    is_active: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskCompaniesTab],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RiskCompaniesTab);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates and loads risk companies plus state options on init', () => {
    fixture.detectChanges();

    const listReq = httpMock.expectOne(
      r => r.url === `${environment.apiUrl}/masters/risk-companies`,
    );
    listReq.flush([sample]);

    const statesReq = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/states`);
    statesReq.flush([]);

    expect(component).toBeTruthy();
    expect(component.currentList).toEqual([sample]);
  });

  it('opens the add modal with a blank form', () => {
    component.openRiskCompanyAdd();
    expect(component.showModal).toBe(true);
    expect(component.isEditMode).toBe(false);
    expect(component.form.name).toBe('');
  });

  it('opens the edit modal populated from the row', () => {
    component.openRiskCompanyEdit(sample);
    expect(component.isEditMode).toBe(true);
    expect(component.form.name).toBe('Acme Risk Co');
    expect(component.form.risk_company_id).toBe('RC-1');
  });

  it('does not save when the name is missing', () => {
    const toast = TestBed.inject(ToastService);
    const errorSpy = vi.spyOn(toast, 'error');
    component.submitRiskCompany({
      risk_company_id: 'RC-1',
      company_id: null,
      id_name: '',
      name: '',
      phone: '',
      is_admitted: true,
      state: '',
      address: '',
      zip: '',
      city: '',
      notes: '',
      is_active: true,
    });
    httpMock.expectNone(() => true);
    expect(errorSpy).toHaveBeenCalledWith('Name is required');
  });

  it('opens a confirm dialog before deleting', () => {
    component.deleteRiskCompany(sample);
    expect(component.confirmOpen).toBe(true);
    expect(component.confirmMessage).toContain('Acme Risk Co');
  });

  it('shows a toast when viewing a policy', () => {
    const toast = TestBed.inject(ToastService);
    const infoSpy = vi.spyOn(toast, 'info');
    component.viewPolicy(sample);
    expect(infoSpy).toHaveBeenCalledWith('View Policy clicked for risk company: Acme Risk Co');
  });

  it('opens the document drawer and loads documents for the selected item', () => {
    component.openDocModal('risk-company' as never, sample);
    expect(component.showDocModal).toBe(true);
    expect(component.selectedItem).toEqual(sample);

    const typesReq = httpMock.expectOne(
      r => r.url === `${environment.apiUrl}/masters/document-types`,
    );
    typesReq.flush([]);

    const getReq = httpMock.expectOne(
      r => r.url === `${environment.apiUrl}/masters/risk-companies/${sample.id}`,
    );
    getReq.flush({ ...sample, documents: [] });
  });
});
