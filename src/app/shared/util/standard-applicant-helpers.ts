/*
Helper functions for Standard Applicants
*/

export function formatDate(iso?: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en-GB') : '—';
}
