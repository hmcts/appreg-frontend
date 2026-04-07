export function toSanitizedPath(url: string | null | undefined): string {
  if (!url) {
    return '';
  }

  try {
    return new URL(url, 'https://local').pathname;
  } catch {
    const queryIndex = url.indexOf('?');
    const hashIndex = url.indexOf('#');
    const cut = Math.min(
      queryIndex === -1 ? url.length : queryIndex,
      hashIndex === -1 ? url.length : hashIndex,
    );

    return url.slice(0, cut);
  }
}
