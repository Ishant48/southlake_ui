import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SimpleMasterTab } from './simple-master-tab';
import { SimpleMode } from '../../models/simple-form.model';
import { environment } from '../../../../../environments/environment';

describe('SimpleMasterTab', () => {
  let component: SimpleMasterTab;
  let fixture: ComponentFixture<SimpleMasterTab>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleMasterTab],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SimpleMasterTab);
    component = fixture.componentInstance;
    component.mode = SimpleMode.Lob;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create and load the list for its mode on init', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/lobs`);
    req.flush([]);
    expect(component).toBeTruthy();
  });

  it('derives the add-button label from its mode', () => {
    component.mode = SimpleMode.Cob;
    expect(component.addLabel).toBe('COB');
  });

  it('also preloads LOB/COB options when mode is Product', () => {
    component.mode = SimpleMode.Product;
    component.ngOnInit();
    const reqs = httpMock.match(
      r =>
        r.url === `${environment.apiUrl}/masters/lobs` ||
        r.url === `${environment.apiUrl}/masters/cobs` ||
        r.url === `${environment.apiUrl}/masters/products`,
    );
    expect(reqs.length).toBe(3);
    reqs.forEach(r => r.flush([]));
  });

  it('opens the add modal with a blank form', () => {
    component.openSimpleAdd();
    expect(component.showModal).toBe(true);
    expect(component.isEditMode).toBe(false);
    expect(component.form.code).toBe('');
  });

  it('opens the edit modal populated from the row', () => {
    component.openSimpleEdit(SimpleMode.Lob, {
      id: 'l-1',
      lob_code: 'AUTO',
      name: 'Auto',
      is_active: true,
    } as never);
    expect(component.isEditMode).toBe(true);
    expect(component.form.code).toBe('AUTO');
    expect(component.form.name).toBe('Auto');
  });

  it('does not save when code or name is missing', () => {
    component.mode = SimpleMode.Lob;
    component.submitSimple({ ...component.form, code: '', name: '' });
    httpMock.expectNone(() => true);
  });

  it('opens a confirm dialog before deleting', () => {
    component.deleteSimple(SimpleMode.Lob, { id: 'l-1', name: 'Auto' } as never);
    expect(component.confirmOpen).toBe(true);
    expect(component.confirmMessage).toContain('Auto');
  });
});
