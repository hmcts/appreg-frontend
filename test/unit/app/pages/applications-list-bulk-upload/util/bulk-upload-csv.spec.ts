import {
  decodeUploadCsv,
  parseUploadCsv,
  writeUploadCsv,
} from '@components/applications-list-detail/applications-list-bulk-upload/util/bulk-upload-csv';

describe('bulk upload CSV preservation', () => {
  it('patches only the selected cell, retaining unknown columns, leading zeros, CRLF and quoted multiline records', () => {
    const source =
      'APPLICANT_CODE|APPLICATION_CODE|EXTRA\r\n0001|BAD|"first\r\nsecond | ""quoted"""\r\n0002|KEEP|\r\n';
    const csv = parseUploadCsv(source);
    expect(csv.records).toHaveLength(2);
    expect(csv.records[0][2].value).toBe('first\r\nsecond | "quoted"');
    expect(writeUploadCsv(csv, new Map([[0, new Map([[1, 'FIXED']])]]))).toBe(
      source.replace('|BAD|', '|"FIXED"|'),
    );
    expect(writeUploadCsv(csv, new Map())).toBe(source);
  });

  it('round trips edits containing delimiters, quotes and newlines', () => {
    const csv = parseUploadCsv('A|B\none|two\nthree|four');
    const value = 'text | "quoted"\nnext line';
    const updated = parseUploadCsv(
      writeUploadCsv(csv, new Map([[1, new Map([[1, value]])]])),
    );
    expect(updated.records[1][1].value).toBe(value);
    expect(updated.records[0].map((cell) => cell.value)).toEqual([
      'one',
      'two',
    ]);
  });

  it('preserves an empty final field without a final newline', () => {
    const csv = parseUploadCsv('A|B\nfirst|');
    expect(csv.records[0].map((cell) => cell.value)).toEqual(['first', '']);
    expect(writeUploadCsv(csv, new Map([[0, new Map([[1, 'last']])]]))).toBe(
      'A|B\nfirst|"last"',
    );
  });

  it.each([
    'A|A\none|two',
    'A|B\none',
    'A|B\none|two|three',
    'A|B\n\none|two',
    'A|B\none|"unclosed',
    'A|B\none|a"b',
    'A|B\none|"two"suffix',
    'A|B\none|back\\slash',
    '\uFEFFA|B\none|two',
    '"A"|B\none|two',
  ])(
    'declines ambiguous input rather than risk incorrect row mapping: %p',
    (source) => {
      expect(() => parseUploadCsv(source)).toThrow();
    },
  );

  it('decodes Windows-1252 without replacing accented characters', () => {
    const bytes = new Uint8Array([0x63, 0x61, 0x66, 0xe9]);
    expect(decodeUploadCsv(bytes.buffer)).toBe('café');
  });

  it('decodes UTF-8 without interpreting the file as Windows-1252', () => {
    const bytes = new Uint8Array([0x63, 0x61, 0x66, 0xc3, 0xa9]);
    expect(decodeUploadCsv(bytes.buffer)).toBe('café');
  });
});
