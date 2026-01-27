export function formatIsoDateToDmy(iso?: string): string {
  // expects "YYYY-MM-DD"
  if (!iso) {
    return '';
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) {
    return iso;
  } // fallback if backend ever changes format
  const [, y, mm, dd] = m;
  return `${dd}/${mm}/${y}`;
}
