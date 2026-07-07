import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MgasTab } from './mgas-tab';
import { environment } from '../../../../../environments/environment';

describe('MgasTab', () => {
  let component: MgasTab;
  let fixture: ComponentFixture<MgasTab>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MgasTab],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MgasTab);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates and loads MGAs plus state options on init', () => {
    fixture.detectChanges();
    const mgasReq = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/mgas`);
    mgasReq.flush([]);
    const statesReq = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/states`);
    statesReq.flush([]);
    expect(component).toBeTruthy();
  });

  it('opens the add modal with a blank form', () => {
    component.openMgaAdd();
    expect(component.showModal).toBe(true);
    expect(component.isEditMode).toBe(false);
    expect(component.form.mga_code).toBe('');
    expect(component.form.name).toBe('');
  });

  it('opens the edit modal populated from a row', () => {
    component.openMgaEdit({
      id: 'm-1',
      mga_code: 'MGA1',
      name: 'Acme MGA',
      is_active: true,
      tax_payable_inhouse: false,
    } as never);
    expect(component.isEditMode).toBe(true);
    expect(component.form.mga_code).toBe('MGA1');
    expect(component.form.name).toBe('Acme MGA');
  });

  it('does not save when required fields are missing', () => {
    component.submitMga({ ...component.form, mga_code: '', name: '' });
    httpMock.expectNone(() => true);
  });

  it('opens a confirm dialog before deleting', () => {
    component.deleteMga({ id: 'm-1', name: 'Acme MGA' } as never);
    expect(component.confirmOpen).toBe(true);
    expect(component.confirmMessage).toContain('Acme MGA');
  });

  it('opens the document drawer and loads documents', () => {
    const mga = { id: 'm-1', mga_code: 'MGA1', name: 'Acme MGA' } as never;
    component.openDocModal('mga' as never, mga);

    const typesReq = httpMock.expectOne(
      r => r.url === `${environment.apiUrl}/masters/document-types`,
    );
    typesReq.flush([]);

    const mgaReq = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/mgas/m-1`);
    mgaReq.flush({ id: 'm-1', mga_code: 'MGA1', name: 'Acme MGA', documents: [] });

    expect(component.showDocModal).toBe(true);
    expect(component.selectedItem).toEqual(mga);
  });
});
