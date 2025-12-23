import { EntryGetSummaryDto } from '@openapi';
import { ApplicationRow } from '@shared-types/applications/applications-form';
import { asIsoDate } from '@util/date-helpers';
import { trimToString } from '@util/string-helpers';

// Local functions
function toYesNo(v: unknown): string {
  if (typeof v !== 'boolean') {
    return '';
  }
  return v ? 'Yes' : 'No';
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
}

function getDirectPartyName(o: Record<string, unknown>): string {
  const applicantName = o['applicantName'];
  if (typeof applicantName === 'string' && applicantName.trim()) {
    return applicantName;
  }

  const respondentName = o['respondentName'];
  if (typeof respondentName === 'string' && respondentName.trim()) {
    return respondentName;
  }

  return '';
}

function getOrganisationName(o: Record<string, unknown>): string {
  const org = asRecord(o['organisation']);
  const name = org?.['name'];
  return typeof name === 'string' ? name : '';
}

function getPersonName(o: Record<string, unknown>): string {
  const person = asRecord(o['person']);
  const nameObj = asRecord(person?.['name']);
  if (!nameObj) {
    return '';
  }

  const first = pickFirstString(nameObj, ['forename', 'firstForename']);
  const last = pickFirstString(nameObj, ['surname']);

  // Ensures exactly one space between parts, and no trailing/leading whitespace.
  return [first, last].filter(Boolean).join(' ');
}

function pickFirstString(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string') {
      const t = v.trim();
      if (t) {
        return t;
      }
    }
  }
  return '';
}

// Org & Person & respondent are objects but we need a string
function formatParty(p: unknown): string {
  const o = asRecord(p);
  if (!o) {
    return '';
  }

  return (
    getDirectPartyName(o) || getOrganisationName(o) || getPersonName(o) || ''
  );
}

// Exported mapper function
export function mapEntrySummaryDtoToApplicationRow(
  dto: EntryGetSummaryDto,
): ApplicationRow {
  const d = dto as unknown as Record<string, unknown>;

  return {
    id: trimToString(d['id']),
    date: asIsoDate(d['date']) || asIsoDate(d['lodgementDate']),
    applicant: formatParty(d['applicant']),
    respondent: formatParty(d['respondent']),
    title: trimToString(d['applicationTitle']) || trimToString(d['title']),
    fee: toYesNo(d['isFeeRequired'] ?? d['feeRequired']),
    resulted: toYesNo(d['isResulted'] ?? d['resulted']),
    status: trimToString(d['status']),
    actions: '',
  };
}
