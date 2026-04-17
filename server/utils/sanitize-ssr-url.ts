export function sanitizeSsrUrl(url: string): string {
  if (
    url.startsWith('//') ||
    url.startsWith('/\\\\') ||
    url.startsWith('\\\\')
  ) {
    return `/${url.replace(/^[/\\]+/, '')}`;
  }

  return url;
}
