// PDF-focused helpers that don't depend on Angular.
// These accept a very small "doc" surface so we can unit test them with mocks.

import { asObj } from './data-utils';
import { trimToString } from './string-helpers';

import type { ApplicationListGetPrintDto } from '@openapi';
import {
  PdfDocLike,
  PrintApplicationListContinuousOptions,
  PrintApplicationListPageOptions,
} from '@shared-types/pdf/pdf.types';

type RowWithId = Record<string, unknown>;
type PrintDtoInput = ApplicationListGetPrintDto | ApplicationListGetPrintDto[];

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

export function filterEntriesToPrint(
  dto: ApplicationListGetPrintDto,
  selectedRows: RowWithId[],
): ApplicationListGetPrintDto {
  const selectedIds = new Set(
    selectedRows.flatMap((row) => {
      const id = row['id'];
      return typeof id === 'string' || typeof id === 'number'
        ? [String(id)]
        : [];
    }),
  );

  return {
    ...dto,
    entries: dto.entries.filter((entry) => selectedIds.has(entry.id)),
  };
}

export async function handlePrintPage(
  dto: PrintDtoInput,
  options: PrintApplicationListPageOptions,
): Promise<void> {
  const printableDtos = toPrintableDtos(dto);

  if (!printableDtos.length) {
    options.onError(options.noEntriesMessage);
    return;
  }

  try {
    if (options.isBrowser) {
      const generateOptions = options.crestUrl
        ? { crestUrl: options.crestUrl }
        : undefined;
      await options.pdf.generatePagedApplicationListPdf(
        Array.isArray(dto) ? printableDtos : printableDtos[0],
        generateOptions,
      );
    }
  } catch {
    options.onError(options.generateErrorMessage);
  }
}

export async function handlePrintContinuous(
  dto: PrintDtoInput,
  options: PrintApplicationListContinuousOptions,
): Promise<void> {
  const printableDtos = toPrintableDtos(dto);

  if (!printableDtos.length) {
    options.onError(options.noEntriesMessage);
    return;
  }

  try {
    if (options.isBrowser) {
      await options.pdf.generateContinuousApplicationListsPdf(
        printableDtos,
        options.isClosed ?? false,
      );
    }
  } catch {
    options.onError(options.generateErrorMessage);
  }
}

function toPrintableDtos(dto: PrintDtoInput): ApplicationListGetPrintDto[] {
  const dtos = Array.isArray(dto) ? dto : [dto];
  return dtos.filter((item) => item.entries.length);
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
    const value = Number(firstNumberMatch[0]);
    const isHour = trimmedText.toLowerCase().includes('h');
    return formatDurationPart(value, isHour ? 'Hour' : 'Minute');
  } // hours present so leave

  const firstValue = Number(firstNumberMatch[0]);
  const secondValue = Number(secondNumberMatch[0]);

  const parts = [
    firstValue ? formatDurationPart(firstValue, 'Hour') : '',
    secondValue ? formatDurationPart(secondValue, 'Minute') : '',
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : undefined;
}

export function formatDurationPart(
  value: number,
  unit: 'Hour' | 'Minute',
): string {
  const suffix = value === 1 ? unit : `${unit}s`;
  return `${value} ${suffix}`;
}
