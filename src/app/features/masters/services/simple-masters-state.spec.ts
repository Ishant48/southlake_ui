import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { SimpleMastersState } from './simple-masters-state';
import { SimpleMode } from '../components/simple-form-modal/simple-form-modal';
import { createBlankSimpleForm } from '../components/simple-form-modal/simple-form-modal';

describe('SimpleMastersState', () => {
  let state: SimpleMastersState;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    state = TestBed.inject(SimpleMastersState);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns a human-readable label for every mode', () => {
    expect(state.getMasterLabel(SimpleMode.Lob)).toBe('Line of Business');
    expect(state.getMasterLabel(SimpleMode.Cob)).toBe('Class of Business');
    expect(state.getMasterLabel(SimpleMode.Reinsurer)).toBe('Reinsurer Company');
    expect(state.getMasterLabel(SimpleMode.Broker)).toBe('Broker');
    expect(state.getMasterLabel(SimpleMode.Product)).toBe('Product');
    expect(state.getMasterLabel(SimpleMode.DocumentType)).toBe('Document Type');
    expect(state.getMasterLabel(SimpleMode.SequencePrefixCounter)).toBe(
      'Sequence Prefix & Counter',
    );
    expect(state.getMasterLabel(SimpleMode.TreatyType)).toBe('Treaty Type');
  });

  it('loads a list from the LOBs endpoint and caches it', () => {
    state.load(SimpleMode.Lob, 'Auto', true).subscribe();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/lobs`);
    req.flush([{ id: 'l-1', name: 'Auto', lob_code: 'AUTO' }]);

    expect(state.lobs).toEqual([{ id: 'l-1', name: 'Auto', lob_code: 'AUTO' }]);
    expect(state.getList(SimpleMode.Lob)).toBe(state.lobs);
  });

  it('loads a list from the treaty-types endpoint and caches it', () => {
    state.load(SimpleMode.TreatyType, 'Quota', true).subscribe();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/treaty-types`);
    req.flush([{ id: 'tt-1', name: 'Quota Share', type_code: 'QS' }]);

    expect(state.treatyTypes).toEqual([{ id: 'tt-1', name: 'Quota Share', type_code: 'QS' }]);
    expect(state.getList(SimpleMode.TreatyType)).toBe(state.treatyTypes);
  });

  it('creates a new record when saving in add mode', () => {
    const form = { ...createBlankSimpleForm(), code: 'AUTO', name: 'Auto' };
    state.save(SimpleMode.Lob, false, form).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/masters/lobs`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updates an existing record when saving in edit mode', () => {
    const form = { ...createBlankSimpleForm(), id: 'l-1', code: 'AUTO', name: 'Auto Updated' };
    state.save(SimpleMode.Lob, true, form).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/masters/lobs/l-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('throws when saving in edit mode without an id', () => {
    const form = { ...createBlankSimpleForm(), code: 'AUTO', name: 'Auto' };
    expect(() => state.save(SimpleMode.Lob, true, form)).toThrow();
  });

  it('deletes a record from the sequence-prefix-counters endpoint', () => {
    state.delete(SimpleMode.SequencePrefixCounter, 'spc-1').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/masters/sequence-prefix-counters/spc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
