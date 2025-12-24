// PDF-focused helpers that don't depend on Angular.
// These accept a very small "doc" surface so we can unit test them with mocks.

import { asObj } from './data-utils';
import { trimToString } from './string-helpers';

/**
 * Minimal interface we need from jsPDF. This keeps utils decoupled from the concrete library.
 */
export type PdfDocLike = {
  splitTextToSize: (text: string, width: number) => string | string[];
  text: (
    text: string,
    x: number,
    y: number,
    opts?: { align?: 'left' | 'right' | 'center' },
  ) => void;
  setFontSize: (size: number) => void;
  setLineWidth: (w: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
};

/**
 * Wrap jsPDF#splitTextToSize with some light trimming and type-guarding.
 * Returns a clean array of lines; empty for blank input.
 */
export function toLines(
  doc: PdfDocLike,
  text: string,
  width: number,
): string[] {
  const t = (text ?? '').trim();
  if (!t) {
    return [];
  }
  const raw: unknown = doc.splitTextToSize(t, width);
  if (typeof raw === 'string') {
    return raw.trim() ? [raw] : [];
  }
  if (Array.isArray(raw)) {
    return (raw as unknown[])
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Draw a vertical stack of lines using a given font size and leading.
 * Returns the height consumed (lines * leading).
 */
export function drawTextBlock(
  doc: PdfDocLike,
  linesArr: string[],
  x: number,
  baseY: number,
  fs: number,
  leading: number,
): number {
  if (!linesArr.length) {
    return 0;
  }
  doc.setFontSize(fs);
  linesArr.forEach((ln, idx) => {
    const yy = Math.round(baseY + idx * leading);
    doc.text(ln, x, yy);
  });
  return linesArr.length * leading;
}

/** Thin horizontal rule with a standard line width. */
export function drawHr(
  doc: PdfDocLike,
  y: number,
  marginX: number,
  pageW: number,
): void {
  doc.setLineWidth(0.7);
  doc.line(marginX, y, pageW - marginX, y);
}

/**
 * Pull a human-readable duration from a raw DTO without coupling the caller
 * to any single property name. Returns '' for "not found".
 */
export function extractDuration(raw: unknown): string | undefined {
  const payload = asObj(raw) ?? {};

  const durationText =
    trimToString(payload['duration']) ||
    trimToString(payload['listDuration']) ||
    trimToString(payload['hearingDuration']) ||
    trimToString(payload['sessionDuration']) ||
    '';

  return stripZeroHoursPrefix(durationText);
}

function stripZeroHoursPrefix(durationText: string): string | undefined {
  const trimmedText = durationText.trim();
  if (!trimmedText) {
    return;
  }

  const numberMatcher = /\d+/g;

  const firstNumberMatch = numberMatcher.exec(trimmedText);
  if (!firstNumberMatch) {
    return trimmedText;
  }

  const secondNumberMatch = numberMatcher.exec(trimmedText);
  if (!secondNumberMatch) {
    return trimmedText;
  } // hours present so leave

  const firstValue = Number(firstNumberMatch[0]);
  const secondValue = Number(secondNumberMatch[0]);

  // "0h 0m", no duration
  if (firstValue === 0 && secondValue === 0) {
    return;
  }

  // "0h 5m", drop the "0h" portion
  if (firstValue === 0 && secondValue !== 0) {
    return trimmedText.slice(secondNumberMatch.index).trim();
  }

  return trimmedText;
}
