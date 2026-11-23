/** Preserve browser handling of modified clicks and intercept ordinary SPA navigation. */
export function handleActionLink(event?: MouseEvent): boolean {
  if (!event) {
    return true;
  }
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }
  event.preventDefault();
  return true;
}
