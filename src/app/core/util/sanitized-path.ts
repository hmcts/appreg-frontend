import { toPathnameOnlyUrl } from '@util/to-pathname-only-url';

export function toSanitizedPath(url: string | null | undefined): string {
  return toPathnameOnlyUrl(url);
}
