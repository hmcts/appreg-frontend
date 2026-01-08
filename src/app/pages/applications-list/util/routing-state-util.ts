import { Location, isPlatformBrowser } from '@angular/common';

export type ApplicantContext = {
  applicant: string;
  respondent: string;
  title: string;
};

export type EntryDetailNavState = {
  appListId?: string;
  resultApplicantContext?: ApplicantContext;
};

function isNavState(x: unknown): x is EntryDetailNavState {
  if (typeof x !== 'object' || x === null) {
    return false;
  }
  const o = x as Record<string, unknown>;

  // appListId optional
  if (
    'appListId' in o &&
    o['appListId'] !== null &&
    typeof o['appListId'] !== 'string'
  ) {
    return false;
  }

  // row optional
  if ('row' in o && o['row'] !== null) {
    const row = o['row'];
    if (typeof row !== 'object' || row === null) {
      return false;
    }
    const r = row as Record<string, unknown>;
    if (typeof r['id'] !== 'string') {
      return false;
    }

    if ('resultApplicantContext' in r && r['resultApplicantContext'] !== null) {
      const ctx = r['resultApplicantContext'];
      if (typeof ctx !== 'object' || ctx === null) {
        return false;
      }
      const c = ctx as Record<string, unknown>;
      if (typeof c['applicant'] !== 'string') {
        return false;
      }
      if (typeof c['respondent'] !== 'string') {
        return false;
      }
      if (typeof c['title'] !== 'string') {
        return false;
      }
    }
  }

  return true;
}

export function readNavState(
  location: Location,
  platformId: object,
): EntryDetailNavState | null {
  if (!isPlatformBrowser(platformId)) {
    return null;
  }

  const raw: unknown = location.getState();
  return isNavState(raw) ? raw : null;
}
