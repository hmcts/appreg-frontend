import { toPathnameOnlyUrl } from '../../src/app/shared/util/to-pathname-only-url';

export function toProxyForwardingLogMessage(
  url: string | null | undefined,
  tokenPresent: boolean,
): string {
  return `[proxy] forwarding ${toPathnameOnlyUrl(url)} tokenPresent=${tokenPresent}`;
}
