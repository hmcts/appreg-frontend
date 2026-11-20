/**
 * Conservative reader for the pipe-separated OpenCSV upload format. Raw cell spans
 * let us replace only explicitly edited values, preserving every other character.
 * Ambiguous OpenCSV syntax is deliberately left to the existing upload workflow.
 */
export interface CsvCell {
  value: string;
  start: number;
  end: number;
}

export interface UploadCsv {
  text: string;
  headers: string[];
  records: CsvCell[][];
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function decodeUploadCsv(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

export function parseUploadCsv(text: string): UploadCsv {
  // Backslash escapes and non-standard quote placement have OpenCSV-specific
  // semantics. Never guess their interpretation when mapping validation rows.
  if (
    !text ||
    text.includes('\\') ||
    text.includes('\u0000') ||
    text.startsWith('\uFEFF')
  ) {
    throw new Error('Unsupported CSV format');
  }
  const records: CsvCell[][] = [];
  let record: CsvCell[] = [];
  let position = 0;
  while (position < text.length) {
    const start = position;
    let value = '';
    if (text[position] === '"') {
      position++;
      let closed = false;
      while (position < text.length) {
        if (text[position] === '"') {
          if (text[position + 1] === '"') {
            value += '"';
            position += 2;
          } else {
            position++;
            closed = true;
            break;
          }
        } else {
          value += text[position++];
        }
      }
      if (
        !closed ||
        (position < text.length && !'|\r\n'.includes(text[position]))
      ) {
        throw new Error('Unsupported CSV quoting');
      }
    } else {
      while (position < text.length && !'|\r\n'.includes(text[position])) {
        if (text[position] === '"') {
          throw new Error('Unsupported CSV quoting');
        }
        value += text[position++];
      }
    }
    record.push({ value, start, end: position });
    if (text[position] === '|') {
      position++;
      if (position === text.length) {
        record.push({ value: '', start: position, end: position });
        records.push(record);
      }
    } else {
      records.push(record);
      record = [];
      if (text[position] === '\r' && text[position + 1] === '\n') {
        position += 2;
      } else if (position < text.length) {
        position++;
      }
    }
  }
  const header = records.shift();
  const headers = header?.map((cell) => cell.value.trim().toUpperCase()) ?? [];
  if (
    headers.length < 2 ||
    headers.some((value) => !value) ||
    new Set(headers).size !== headers.length ||
    header?.some((cell) => text[cell.start] === '"') ||
    !records.length ||
    records.length > 1050 ||
    records.some(
      (row) =>
        row.length !== headers.length ||
        row.every((cell) => !cell.value.trim()),
    )
  ) {
    throw new Error('CSV records cannot be mapped safely');
  }
  return { text, headers, records };
}

/** Patches are keyed by original record index, then original column index. */
export type CsvEdits = ReadonlyMap<number, ReadonlyMap<number, string>>;

export function writeUploadCsv(csv: UploadCsv, edits: CsvEdits): string {
  const replacements: { start: number; end: number; value: string }[] = [];
  for (const [row, fields] of edits) {
    for (const [column, value] of fields) {
      const cell = csv.records[row]?.[column];
      if (!cell) {
        throw new Error('Invalid CSV cell');
      }
      // OpenCSV's default escape character is backslash. Doubling it protects
      // literal user input; quotes are escaped using standard doubled quotes.
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '""');
      replacements.push({
        start: cell.start,
        end: cell.end,
        value: `"${escaped}"`,
      });
    }
  }
  replacements.sort((a, b) => b.start - a.start);
  let text = csv.text;
  for (const replacement of replacements) {
    text =
      text.slice(0, replacement.start) +
      replacement.value +
      text.slice(replacement.end);
  }
  return text;
}
