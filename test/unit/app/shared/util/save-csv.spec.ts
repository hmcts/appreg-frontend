import { HttpHeaders, HttpResponse } from '@angular/common/http';

import { saveCsv } from '@util/save-csv';

describe('saveCsv', () => {
  const platformId = {};
  const browserPlatformId = 'browser' as unknown as object;
  let document: Document;
  let anchor: HTMLAnchorElement;
  let createObjectUrl: jest.SpyInstance;
  let revokeObjectUrl: jest.SpyInstance;

  beforeEach(() => {
    document = window.document;
    anchor = document.createElement('a');
    jest.spyOn(document, 'createElement').mockReturnValue(anchor);
    createObjectUrl = jest.fn().mockReturnValue('blob:csv');
    revokeObjectUrl = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('downloads a CSV string as a blob', () => {
    const response = new HttpResponse({
      body: 'header\nvalue\n',
      headers: new HttpHeaders({ 'content-type': 'text/csv' }),
    });

    expect(saveCsv(response, 'export.csv', document, browserPlatformId)).toBe(
      true,
    );

    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchor.download).toBe('export.csv');
    expect(revokeObjectUrl).not.toHaveBeenCalled();
  });

  it('downloads an existing CSV blob', () => {
    const blob = new Blob(['header\n'], { type: 'text/csv' });
    const response = new HttpResponse({ body: blob });

    expect(saveCsv(response, 'report.csv', document, browserPlatformId)).toBe(
      true,
    );
    expect(createObjectUrl).toHaveBeenCalledWith(blob);
  });

  it('does not download a missing body or during SSR', () => {
    expect(
      saveCsv(
        new HttpResponse<string>({ body: null }),
        'empty.csv',
        document,
        browserPlatformId,
      ),
    ).toBe(false);
    expect(
      saveCsv(
        new HttpResponse<string>({ body: 'csv' }),
        'ssr.csv',
        document,
        platformId,
      ),
    ).toBe(false);
    expect(createObjectUrl).not.toHaveBeenCalled();
  });
});
