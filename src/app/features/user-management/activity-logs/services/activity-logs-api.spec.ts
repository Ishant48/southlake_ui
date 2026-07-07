import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { ActivityLogsApi } from './activity-logs-api';

describe('ActivityLogsApi', () => {
  let api: ActivityLogsApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/activity-logs`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ActivityLogsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets logs with filter params', () => {
    api.getLogs({ page: 1, search: 'login', action: 'login', module_id: 'auth' }).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('login');
    expect(req.request.params.get('action')).toBe('login');
    expect(req.request.params.get('module_id')).toBe('auth');
    req.flush({ data: [], total: 0, page: 1, per_page: 20, total_pages: 0 });
  });

  it('exports logs as a blob with filter params', () => {
    api.exportLogs({ search: 'login' }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${base}/export`);
    expect(req.request.params.get('search')).toBe('login');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });
});
