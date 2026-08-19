/**
 * The application root always belongs to the UI. Some probes use a wildcard
 * Accept header
 * rather than text/html, so Accept alone must not decide its destination.
 */
export function isUiRootPath(path: string): boolean {
  return path === '/';
}
