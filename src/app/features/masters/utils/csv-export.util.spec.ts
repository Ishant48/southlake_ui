import { downloadCsv } from './csv-export.util';

describe('downloadCsv', () => {
  it('creates and clicks a download link with a CSV blob URL', () => {
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv(['Code', 'Name'], [['A1', 'Alpha "One"']], 'test.csv');

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('escapes quotes and handles null/undefined cell values', () => {
    let capturedBlob: Blob | undefined;
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv(
      ['A'],
      [[null, undefined, 'has "quotes"'] as unknown as (string | null)[]],
      'x.csv',
    );

    expect(capturedBlob).toBeInstanceOf(Blob);
    expect(capturedBlob?.type).toBe('text/csv;charset=utf-8;');

    createObjectURLSpy.mockRestore();
    vi.restoreAllMocks();
  });
});
