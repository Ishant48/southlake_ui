import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { GlMappingsTab } from './gl-mappings-tab';
import { environment } from '../../../../../environments/environment';

describe('GlMappingsTab', () => {
  let component: GlMappingsTab;
  let fixture: ComponentFixture<GlMappingsTab>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlMappingsTab],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(GlMappingsTab);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create and load GL mappings on init', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(`${environment.apiUrl}/gl-mappings`);
    req.flush([]);
    expect(component).toBeTruthy();
  });

  it('opens the add modal with a blank form and loads coa options', () => {
    component.openGlMappingAdd();
    expect(component.showModal).toBe(true);
    expect(component.isEditMode).toBe(false);
    expect(component.form.coa_id).toBe('');
    expect(component.form.type).toBe('');
    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/chart-of-accounts` || r.url.includes('chart-of-accounts'),
    );
    req.flush([]);
  });

  it('opens the edit modal populated from a row', () => {
    component.openGlMappingEdit({ id: 'g-1', coa_id: 'c-1', type: 'AR' } as never);
    expect(component.isEditMode).toBe(true);
    expect(component.form.id).toBe('g-1');
    expect(component.form.coa_id).toBe('c-1');
    expect(component.form.type).toBe('AR');
    const req = httpMock.match(() => true);
    req.forEach(r => r.flush([]));
  });

  it('does not save when coa_id or type is missing', () => {
    component.submitGlMapping({ coa_id: '', type: '' });
    httpMock.expectNone(() => true);
  });

  it('opens a confirm dialog before deleting', () => {
    component.deleteGlMapping({ id: 'g-1', coa_id: 'c-1', type: 'AR' } as never);
    expect(component.confirmOpen).toBe(true);
    expect(component.pendingAction).toBeTruthy();
  });
});
