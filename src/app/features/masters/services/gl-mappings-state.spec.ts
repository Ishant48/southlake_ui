import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { GlMappingsState } from './gl-mappings-state';

describe('GlMappingsState', () => {
  let state: GlMappingsState;
  let httpMock: HttpTestingController;
  const mappingsBase = `${environment.apiUrl}/gl-mappings`;
  const coaBase = `${environment.apiUrl}/chart-of-accounts`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    state = TestBed.inject(GlMappingsState);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads and caches all mappings when no search term is given', () => {
    state.load().subscribe();
    const req = httpMock.expectOne(mappingsBase);
    req.flush([
      { id: 'm-1', type: 'AR', coa: { account_code: '1000', description: 'Cash' } },
      { id: 'm-2', type: 'AP', coa: { account_code: '2000', description: 'Payables' } },
    ]);

    expect(state.glMappings.length).toBe(2);
  });

  it('filters cached mappings by search term against type, code, and description', () => {
    state.load('cash').subscribe();
    const req = httpMock.expectOne(mappingsBase);
    req.flush([
      { id: 'm-1', type: 'AR', coa: { account_code: '1000', description: 'Cash' } },
      { id: 'm-2', type: 'AP', coa: { account_code: '2000', description: 'Payables' } },
    ]);

    expect(state.glMappings).toEqual([
      { id: 'm-1', type: 'AR', coa: { account_code: '1000', description: 'Cash' } },
    ]);
  });

  it('loads chart-of-account options and excludes parent accounts', () => {
    state.loadCoaOptions().subscribe();
    const req = httpMock.expectOne(r => r.url === coaBase);
    req.flush([
      { id: 'c-1', is_parent: false, account_code: '1000', description: 'Cash' },
      { id: 'c-2', is_parent: true, account_code: '2000', description: 'Parent' },
    ]);

    expect(state.coaOptions).toEqual([
      { id: 'c-1', is_parent: false, account_code: '1000', description: 'Cash' },
    ]);
  });

  it('creates a mapping when not in edit mode', () => {
    state.save(false, undefined, { coa_id: 'c-1', type: 'AR' }).subscribe();
    const req = httpMock.expectOne(mappingsBase);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updates a mapping when in edit mode with an id', () => {
    state.save(true, 'm-1', { coa_id: 'c-1', type: 'AR' }).subscribe();
    const req = httpMock.expectOne(`${mappingsBase}/m-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a mapping', () => {
    state.delete('m-1').subscribe();
    const req = httpMock.expectOne(`${mappingsBase}/m-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('formats the GL number display from the linked chart of account', () => {
    expect(
      state.getGLNumberDisplay({ coa: { account_code: '1000', description: 'Cash' } } as never),
    ).toBe('1000 - Cash');
    expect(state.getGLNumberDisplay({} as never)).toBe('-');
  });
});
