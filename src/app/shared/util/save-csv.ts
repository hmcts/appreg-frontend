import { isPlatformBrowser } from '@angular/common';
import { HttpResponse } from '@angular/common/http';

export function saveCsv(
  response: HttpResponse<string | Blob>,
  filename: string,
  document: Document,
  platformId: object,
): boolean {
  if (!response.body || !isPlatformBrowser(platformId)) {
    return false;
  }

  const csvBlob =
    typeof response.body === 'string'
      ? new Blob([response.body], {
          type:
            response.headers.get('content-type') ?? 'text/csv;charset=utf-8',
        })
      : response.body;
  const url = URL.createObjectURL(csvBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}
