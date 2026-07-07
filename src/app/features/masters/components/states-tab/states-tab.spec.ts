import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StatesTab } from './states-tab';
import { DocumentMode } from '../../models/master-tab.model';
import { environment } from '../../../../../environments/environment';

describe('StatesTab', () => {
  let component: StatesTab;
  let fixture: ComponentFixture<StatesTab>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatesTab],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(StatesTab);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates and loads states on init', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/states`);
    req.flush([]);
    expect(component).toBeTruthy();
  });

  it('opens the add modal with a blank form', () => {
    component.openStateAdd();
    expect(component.showModal).toBe(true);
    expect(component.isEditMode).toBe(false);
    expect(component.form.state_code).toBeNull();
    expect(component.form.name).toBe('');
  });

  it('opens the edit modal populated from the row', () => {
    component.openStateEdit({
      id: 's-1',
      state_code: 6,
      state_abbr: 'CA',
      name: 'California',
      notes: 'Coastal',
      is_active: true,
    });
    expect(component.isEditMode).toBe(true);
    expect(component.modalTitle).toBe('Edit State: California');
    expect(component.form.state_abbr).toBe('CA');
    expect(component.form.name).toBe('California');
  });

  it('does not save when required fields are missing', () => {
    component.submitState({ ...component.form, state_code: null, state_abbr: '', name: '' });
    httpMock.expectNone(() => true);
  });

  it('opens a confirm dialog before deleting', () => {
    component.deleteState({
      id: 's-1',
      state_code: 6,
      state_abbr: 'CA',
      name: 'California',
      is_active: true,
    });
    expect(component.confirmOpen).toBe(true);
    expect(component.confirmMessage).toContain('California');
  });

  it('opens the document drawer and loads documents for a state', () => {
    const state = {
      id: 's-1',
      state_code: 6,
      state_abbr: 'CA',
      name: 'California',
      is_active: true,
    };
    component.openDocModal(DocumentMode.State, state);

    expect(component.showDocModal).toBe(true);
    expect(component.selectedItem).toBe(state);

    const typesReq = httpMock.expectOne(
      r => r.url === `${environment.apiUrl}/masters/document-types`,
    );
    typesReq.flush([]);

    const docReq = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/states/s-1`);
    docReq.flush({ ...state, documents: [{ id: 'd-1', file_name: 'f.pdf', file_url: 'f.pdf' }] });

    expect(component.documentsDrawerState.documentsList.length).toBe(1);
  });
});
