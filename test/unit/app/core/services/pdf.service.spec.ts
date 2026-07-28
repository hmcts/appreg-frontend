import { formatDate } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { StandardApplicantPrintRowDto } from '@openapi';
import { PdfService } from '@services/pdf.service';

type JsPDFInstance = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  setFont: jest.Mock;
  setFontSize: jest.Mock;
  text: jest.Mock;
  line: jest.Mock;
  setLineWidth: jest.Mock;
  addImage: jest.Mock;
  addPage: jest.Mock;
  save: jest.Mock;
  splitTextToSize: jest.Mock;
};

type JsPDFModuleMock = {
  jsPDF: jest.Mock;
  __instance: JsPDFInstance;
};

jest.mock('jspdf', () => {
  const instance: JsPDFInstance = {
    internal: {
      pageSize: {
        getWidth: () => 595,
        getHeight: () => 842,
      },
    },
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    line: jest.fn(),
    setLineWidth: jest.fn(),
    addImage: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
    splitTextToSize: jest.fn((t: string | string[]) => {
      const s = Array.isArray(t) ? t.join('\n') : String(t);
      return s.split(/\r?\n/);
    }),
  };
  const jsPDF = jest.fn().mockImplementation(() => instance);
  return { jsPDF, __instance: instance };
});

jest.mock('jspdf-autotable', () => ({
  autoTable: jest.fn(),
}));

function findTextCallContaining(
  textCalls: unknown[][],
  substring: string,
): unknown[] | undefined {
  for (const call of textCalls) {
    const textArg = call[0];
    if (textArgContains(textArg, substring)) {
      return call;
    }
  }
  return undefined;
}

function textArgContains(textArg: unknown, substring: string): boolean {
  if (typeof textArg === 'string') {
    return textArg.includes(substring);
  }

  if (Array.isArray(textArg)) {
    return arrayContainsSubstring(textArg, substring);
  }

  return false;
}

function arrayContainsSubstring(values: unknown[], substring: string): boolean {
  for (const v of values) {
    if (typeof v === 'string' && v.includes(substring)) {
      return true;
    }
  }
  return false;
}

// Utility to access the mocked jsPDF instance safely
const getJsPDF = (): JsPDFModuleMock =>
  jest.requireMock('jspdf') as unknown as JsPDFModuleMock;

// Freeze time so footer & filename date are deterministic
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-09-17T12:00:00.000Z'));
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  const { __instance, jsPDF } = getJsPDF();
  // Clear all jsPDF method calls
  jsPDF.mockClear();
  __instance.setFont.mockClear();
  __instance.setFontSize.mockClear();
  __instance.text.mockClear();
  __instance.line.mockClear();
  __instance.setLineWidth.mockClear();
  __instance.addImage.mockClear();
  __instance.addPage.mockClear();
  __instance.save.mockClear();
  __instance.splitTextToSize.mockClear();
});

// Helpers to assert against doc.text calls
const textCallsContain = (substr: string): boolean => {
  const { __instance } = getJsPDF();
  return __instance.text.mock.calls.some(([arg]) => {
    if (Array.isArray(arg)) {
      return arg.some((s) => typeof s === 'string' && s.includes(substr));
    }
    return typeof arg === 'string' && arg.includes(substr);
  });
};
const anyTextCallMatches = (re: RegExp): boolean => {
  const { __instance } = getJsPDF();
  return __instance.text.mock.calls.some(([arg]) => {
    if (Array.isArray(arg)) {
      return arg.some((s) => typeof s === 'string' && re.test(s));
    }
    return typeof arg === 'string' && re.test(arg);
  });
};

describe('PdfService.generateApplicationListPdf', () => {
  let service: PdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PdfService,
        { provide: LOCALE_ID, useValue: 'en-GB' }, // or whatever your app uses
      ],
    });

    service = TestBed.inject(PdfService);
  });

  it('names the file as "<court-name>-<YYYY-MM-DD>-print-page.pdf" (fileSafe + exact date)', async () => {
    const { __instance } = getJsPDF();

    await service.generatePagedApplicationListPdf({
      courtName: 'Bath Magistrates Court',
      date: '2025-09-17',
      entries: [{}],
    });

    expect(__instance.save).toHaveBeenCalledTimes(1);
    expect(__instance.save.mock.calls[0][0]).toBe(
      'bath-magistrates-court-2025-09-17-print-page.pdf',
    );
  });

  it('names the file as "<cja-name>-<YYYY-MM-DD>-print-page.pdf" when courtName is missing (strips code prefix)', async () => {
    const { __instance } = getJsPDF();

    await service.generatePagedApplicationListPdf({
      courtName: '',
      cja: '01 - CJA Number 1',
      date: '2025-09-17',
      entries: [{}],
    });

    expect(__instance.save).toHaveBeenCalledTimes(1);
    expect(__instance.save.mock.calls[0][0]).toBe(
      'cja-number-1-2025-09-17-print-page.pdf',
    );
  });

  it('falls back to "court-<today>-print-page.pdf" when courtName/date are missing', async () => {
    const { __instance } = getJsPDF();

    await service.generatePagedApplicationListPdf({
      entries: [{}],
    });

    expect(__instance.save).toHaveBeenCalledWith(
      'court-2025-09-17-print-page.pdf',
    );
  });

  it('creates one page per entry (addPage called for each additional entry)', async () => {
    const { __instance } = getJsPDF();

    await service.generatePagedApplicationListPdf({
      courtName: 'X',
      date: '2025-09-17',
      entries: [{}, {}, {}],
    });

    expect(__instance.addPage).toHaveBeenCalledTimes(2);
  });

  it('creates one page per entry across multiple DTOs and uses each parent list header', async () => {
    const { __instance } = getJsPDF();

    await service.generatePagedApplicationListPdf([
      {
        courtName: 'Court A',
        date: '2025-09-17',
        entries: [{}, {}],
      },
      {
        courtName: 'Court B',
        date: '2025-09-18',
        entries: [{}],
      },
    ]);

    expect(__instance.addPage).toHaveBeenCalledTimes(2);
    expect(textCallsContain('Court A')).toBe(true);
    expect(textCallsContain('Court B')).toBe(true);
    expect(__instance.save).toHaveBeenCalledWith(
      'applications-2025-09-17-print-page.pdf',
    );
  });

  it('renders header labels and footer date (produced on)', async () => {
    await service.generatePagedApplicationListPdf({
      courtName: 'Bath Magistrates Court',
      date: '2025-09-17',
      entries: [{}],
    });

    // Header title
    expect(textCallsContain('Bath Magistrates Court')).toBe(true);

    // Left column "Application\nbrought by" rendered across lines
    expect(textCallsContain('Application')).toBe(true);
    expect(textCallsContain('brought by')).toBe(true);

    // Footer label and date (DD/MM/YYYY)
    expect(textCallsContain('Produced on')).toBe(true);
    expect(anyTextCallMatches(/\b\d{2}\/\d{2}\/\d{4}\b/)).toBe(true);
  });

  it('prints the application code row only when code is non-empty', async () => {
    await service.generatePagedApplicationListPdf({
      courtName: 'X',
      date: '2025-09-17',
      entries: [
        { code: 'AP01', description: 'Desc A', result: 'Result A' },
        { code: '   ', description: 'Desc B', result: 'Result B' },
      ],
    });

    expect(textCallsContain('AP01')).toBe(true);

    expect(textCallsContain('   ')).toBe(false);
  });

  it('adds crest image when a crestUrl is provided and resolves to a data URL', async () => {
    const { __instance } = getJsPDF();

    const spy = jest
      .spyOn(
        service as unknown as {
          tryLoadImageAsDataUrl: (u: string) => Promise<string | null>;
        },
        'tryLoadImageAsDataUrl',
      )
      .mockResolvedValue('data:image/png;base64,AAA');

    await service.generatePagedApplicationListPdf(
      { courtName: 'X', date: '2025-09-17', entries: [{}] },
      { crestUrl: '/assets/govuk-crest.png' },
    );

    expect(spy).toHaveBeenCalledWith('/assets/govuk-crest.png');
    expect(__instance.addImage).toHaveBeenCalledTimes(1);
  });

  it('skips crest image if crestUrl is omitted or load fails', async () => {
    const { __instance } = getJsPDF();

    // No crestUrl
    await service.generatePagedApplicationListPdf({ entries: [{}] });
    expect(__instance.addImage).toHaveBeenCalledTimes(0);

    // crestUrl provided but loader returns null
    jest
      .spyOn(
        service as unknown as {
          tryLoadImageAsDataUrl: (u: string) => Promise<string | null>;
        },
        'tryLoadImageAsDataUrl',
      )
      .mockResolvedValueOnce(null);

    await service.generatePagedApplicationListPdf(
      { entries: [{}] },
      { crestUrl: '/x.png' },
    );
    expect(__instance.addImage).toHaveBeenCalledTimes(0);
  });
});

describe('PdfService.generateStandardApplicantsPdf', () => {
  let service: PdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PdfService, { provide: LOCALE_ID, useValue: 'en-GB' }],
    });

    service = TestBed.inject(PdfService);
    const { autoTable } = jest.requireMock('jspdf-autotable');
    autoTable.mockClear();
  });

  it('renders the report header, applicant fields, formatted dates, and filename', async () => {
    const { __instance, jsPDF } = getJsPDF();
    const { autoTable } = jest.requireMock('jspdf-autotable');

    await service.generateStandardApplicantsPdf({
      reportTitle: 'Standard Applicants',
      searchCriteria: {
        code: 'SA',
        name: null,
        addressLine1: null,
        from: null,
        to: null,
      },
      generatedAt: '2026-03-10T10:00:00Z',
      recordCount: 1,
      applicants: [
        {
          code: 'SA001',
          useFrom: '2020-01-01',
          name: 'Citizen Advice Manchester',
          useTo: null,
          title: 'Mr',
          addressLine1: '1 Crown Sq',
          forename1: 'Test',
          addressLine2: 'Manchester',
          forename2: null,
          addressLine3: null,
          forename3: null,
          addressLine4: null,
          surname: 'Applicant',
          addressLine5: null,
          emailAddress: 'email@example.test',
          postcode: 'M1 1AA',
          telephoneNumber: '01234567890',
          mobileNumber: null,
        },
      ],
    });

    expect(jsPDF).toHaveBeenCalledWith({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });
    expect(textCallsContain('Standard Applicants')).toBe(true);
    expect(textCallsContain('Search criteria: Code: SA')).toBe(true);
    expect(autoTable).toHaveBeenCalledTimes(1);
    expect(autoTable.mock.calls[0][1].body).toEqual([
      ['Code', 'SA001', 'Use from', '1 Jan 2020'],
      ['Name', 'Citizen Advice Manchester', 'Use to', '—'],
      ['Title', 'Mr', 'Address line 1', '1 Crown Sq'],
      ['Forename 1', 'Test', 'Address line 2', 'Manchester'],
      ['Forename 2', '—', 'Address line 3', '—'],
      ['Forename 3', '—', 'Address line 4', '—'],
      ['Surname', 'Applicant', 'Address line 5', '—'],
      ['Email address', 'email@example.test', 'Postcode', 'M1 1AA'],
      ['Telephone number', '01234567890', 'Mobile number', '—'],
    ]);
    expect(__instance.save).toHaveBeenCalledWith(
      'standard-applicant-pdf-2025-09-17.pdf',
    );
  });

  it('does not create a document for a missing DTO', async () => {
    const { jsPDF } = getJsPDF();

    await service.generateStandardApplicantsPdf(null as never);

    expect(jsPDF).not.toHaveBeenCalled();
  });

  describe('standardApplicantSearchCriteria', () => {
    type PrivateFns = {
      standardApplicantSearchCriteria: (
        criteria:
          | {
              code: string | null;
              name: string | null;
              addressLine1: string | null;
              from: string | null;
              to: string | null;
            }
          | null
          | undefined,
      ) => string;
    };

    const priv = (s: PdfService): PrivateFns => s as unknown as PrivateFns;

    it('formats populated code and name criteria', () => {
      expect(
        priv(service).standardApplicantSearchCriteria({
          code: 'SA001',
          name: 'Citizen Advice Manchester',
          addressLine1: null,
          from: null,
          to: null,
        }),
      ).toBe('Code: SA001, Name: Citizen Advice Manchester');
    });

    it('omits blank criteria and returns an empty string when none are supplied', () => {
      const emptyCriteria = {
        code: '   ',
        name: '\n\t',
        addressLine1: 'ignored',
        from: 'ignored',
        to: 'ignored',
      };

      expect(priv(service).standardApplicantSearchCriteria(emptyCriteria)).toBe(
        '',
      );
      expect(priv(service).standardApplicantSearchCriteria(null)).toBe('');
      expect(priv(service).standardApplicantSearchCriteria(undefined)).toBe('');
    });
  });

  describe('standardApplicantValue', () => {
    type PrivateFns = {
      standardApplicantValue: (
        applicant: StandardApplicantPrintRowDto,
        label: string,
      ) => string;
    };

    const priv = (s: PdfService): PrivateFns => s as unknown as PrivateFns;

    const applicant: StandardApplicantPrintRowDto = {
      code: 'SA001',
      useFrom: '2020-01-01',
      name: 'Citizen Advice Manchester',
      useTo: '2020-12-31',
      title: 'Mr',
      addressLine1: '1 Crown Sq',
      forename1: 'John',
      addressLine2: 'Manchester',
      forename2: 'James',
      addressLine3: 'Greater Manchester',
      forename3: 'Joseph',
      addressLine4: 'United Kingdom',
      surname: 'Applicant',
      addressLine5: 'M1 1AA',
      emailAddress: 'email@example.test',
      postcode: 'M1 1AA',
      telephoneNumber: '01234567890',
      mobileNumber: '07123456789',
    };

    it.each([
      ['Code', 'SA001'],
      ['Name', 'Citizen Advice Manchester'],
      ['Title', 'Mr'],
      ['Address line 1', '1 Crown Sq'],
      ['Forename 1', 'John'],
      ['Address line 2', 'Manchester'],
      ['Forename 2', 'James'],
      ['Address line 3', 'Greater Manchester'],
      ['Forename 3', 'Joseph'],
      ['Address line 4', 'United Kingdom'],
      ['Surname', 'Applicant'],
      ['Address line 5', 'M1 1AA'],
      ['Email address', 'email@example.test'],
      ['Postcode', 'M1 1AA'],
      ['Telephone number', '01234567890'],
      ['Mobile number', '07123456789'],
    ])('maps %s to its applicant value', (label, expected) => {
      expect(priv(service).standardApplicantValue(applicant, label)).toBe(
        expected,
      );
    });

    it('formats use dates with the DateTimePipe', () => {
      expect(priv(service).standardApplicantValue(applicant, 'Use from')).toBe(
        '1 Jan 2020',
      );
      expect(priv(service).standardApplicantValue(applicant, 'Use to')).toBe(
        '31 Dec 2020',
      );
    });

    it('returns an em dash for null, undefined, or unknown values', () => {
      expect(
        priv(service).standardApplicantValue(
          { ...applicant, name: null },
          'Name',
        ),
      ).toBe('—');
      expect(
        priv(service).standardApplicantValue(applicant, 'Unknown label'),
      ).toBe('—');
    });
  });
});

describe('PdfService.generateContinuousApplicationListsPdf', () => {
  let service: PdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PdfService,
        { provide: LOCALE_ID, useValue: 'en-GB' }, // or whatever your app uses
      ],
    });

    service = TestBed.inject(PdfService);
  });

  const makeRawDto = (
    overrides: Partial<Record<string, unknown>> = {},
    entryOverrides?: unknown[],
  ) => ({
    courtName: 'Bath Magistrates Court',
    listDate: '2025-09-17',
    duration: '45m',
    entries: entryOverrides ?? [
      {
        applicant: {
          person: { name: { forename: 'Alice', surname: 'Smith' } },
        },
        respondent: { organisation: { name: 'ACME Ltd' } },
        applicationCode: 'AP01',
        applicationTitle: 'Foo Title',
        caseReference: 'REF-1',
        accountReference: 'ACC-9',
        resultWordings: ['Granted'],
        officials: [
          {
            title: 'Mr',
            surname: 'testsurofficial',
            forename: 'testforeofficial',
            type: 'MAGISTRATE',
          },
        ],
        notes: 'No additional notes',
      },
    ],
    ...overrides,
  });

  it('constructs a landscape jsPDF and renders header with page number', async () => {
    const { jsPDF } = getJsPDF();

    await service.generateContinuousApplicationListsPdf([makeRawDto()], false);

    expect(jsPDF).toHaveBeenCalledWith({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });
    expect(textCallsContain('Check List Report')).toBe(true);
    expect(textCallsContain('Page 1')).toBe(true);
  });

  it('names file "<court>-<YYYY-MM-DD>-print-cont.pdf" when all lists share the same court', async () => {
    const { __instance } = getJsPDF();

    await service.generateContinuousApplicationListsPdf(
      [
        makeRawDto({ courtName: 'Bath Magistrates Court' }),
        makeRawDto({ courtName: 'Bath Magistrates Court' }),
      ],
      false,
    );

    expect(__instance.save).toHaveBeenCalledTimes(1);
    expect(__instance.save).toHaveBeenCalledWith(
      'bath-magistrates-court-2025-09-17-print-cont.pdf',
    );
  });

  it('names file "<cja>-<YYYY-MM-DD>-print-cont.pdf" when all lists share the same CJA and courtName is missing (strips code prefix)', async () => {
    const { __instance } = getJsPDF();

    await service.generateContinuousApplicationListsPdf(
      [
        makeRawDto({ courtName: '', cja: '01 - CJA Number 1' }),
        makeRawDto({ courtName: '', cja: '01 - CJA Number 1' }),
      ],
      false,
    );

    expect(__instance.save).toHaveBeenCalledTimes(1);
    expect(__instance.save).toHaveBeenCalledWith(
      'cja-number-1-2025-09-17-print-cont.pdf',
    );
  });

  it('names file "applications-<YYYY-MM-DD>-print-cont.pdf" when courts differ or are missing', async () => {
    const { __instance } = getJsPDF();

    await service.generateContinuousApplicationListsPdf(
      [
        makeRawDto({ courtName: 'Bath Magistrates Court' }),
        makeRawDto({ courtName: 'Bristol Crown Court' }),
        makeRawDto({ courtName: '' }),
      ],
      false,
    );

    expect(__instance.save).toHaveBeenCalledTimes(1);
    expect(__instance.save).toHaveBeenCalledWith(
      'applications-2025-09-17-print-cont.pdf',
    );
  });

  it('adds a new page and increments page number when content exceeds available space', async () => {
    const { __instance } = getJsPDF();

    // Force a very short page height so ensureSpace() triggers
    const originalGetHeight = __instance.internal.pageSize.getHeight;
    __instance.internal.pageSize.getHeight = () => 180; // tiny to guarantee breaks

    try {
      // Make one DTO with an entry that has a very tall "Notes" block
      const tallNotes = new Array(50).fill('line').join('\n');
      await service.generateContinuousApplicationListsPdf(
        [
          makeRawDto({}, [
            {
              applicant: { person: { name: { forename: 'A', surname: 'S' } } },
              respondent: { organisation: { name: 'Org' } },
              notes: tallNotes,
            },
          ]),
        ],
        false,
      );

      expect(__instance.addPage).toHaveBeenCalled(); // at least once
      expect(textCallsContain('Page 2')).toBe(true);
    } finally {
      __instance.internal.pageSize.getHeight = originalGetHeight;
    }
  });

  it('renders the top meta row and application blocks (labels + values)', async () => {
    await service.generateContinuousApplicationListsPdf(
      [
        makeRawDto({}, [
          {
            applicant: {
              person: { name: { forename: 'Jane', surname: 'Roe' } },
            },
            respondent: { organisation: { name: 'Widgets Ltd' } },
            applicationCode: 'AP01',
            applicationTitle: 'Interim Relief',
            applicationWording: 'Test wording',
            caseReference: 'CASE-42',
            accountReference: 'ACC-9',
            resultWordings: ['Refused'],
            officials: [
              {
                title: 'Mr',
                surname: 'Taylor',
                forename: 'Hugh',
                type: 'MAGISTRATE',
              },
            ],
            notes: 'Some note\nAnother line',
          },
        ]),
      ],
      false,
    );

    // Top meta row
    expect(textCallsContain('Date & Time')).toBe(true);
    expect(textCallsContain('Duration')).toBe(true);
    expect(textCallsContain('Location')).toBe(true);

    // Parties + sections
    expect(textCallsContain('Applicant')).toBe(true);
    expect(textCallsContain('Respondent')).toBe(true);
    expect(textCallsContain('Application')).toBe(true);
    expect(textCallsContain('Result')).toBe(true);
    expect(textCallsContain('Notes')).toBe(true);
    expect(textCallsContain('This matter was before')).toBe(true);

    // Left/right application block contents
    expect(textCallsContain('Case Reference: CASE-42')).toBe(true);
    expect(textCallsContain('Application Code: AP01')).toBe(true);
    expect(textCallsContain('Test wording')).toBe(true);
    expect(textCallsContain('Account Reference: ACC-9')).toBe(true);
    expect(textCallsContain('Application Title: Interim Relief')).toBe(true);

    // Judge name appears in the "This matter was before" row
    expect(textCallsContain('Taylor')).toBe(true);
    expect(textCallsContain('Hugh')).toBe(true);
    expect(textCallsContain('MAGISTRATE')).toBe(true);
  });

  it('uses "Applications Register Report" as the header title when isClosed is true', async () => {
    const { __instance } = getJsPDF();

    await service.generateContinuousApplicationListsPdf([makeRawDto()], true);

    // Title should be rendered via doc.text(title, M, headerY)
    const titleCall = __instance.text.mock.calls.find(
      (c) => c[0] === 'Applications Register Report',
    );

    expect(titleCall).toBeTruthy();
    // M = 40, TITLE_FS = 20 => headerY = 60
    expect(titleCall?.[1]).toBe(40);
    expect(titleCall?.[2]).toBe(60);

    // Ensure the non-closed title was not used
    expect(textCallsContain('Check List Report')).toBe(false);
  });

  it('renders multiple officials on separate lines (one per object)', async () => {
    const { __instance } = getJsPDF();

    await service.generateContinuousApplicationListsPdf(
      [
        makeRawDto({}, [
          {
            applicant: {
              person: { name: { forename: 'Jane', surname: 'Roe' } },
            },
            respondent: { organisation: { name: 'Widgets Ltd' } },
            officials: [
              {
                title: 'Mr',
                surname: 'Alpha',
                forename: 'A',
                type: 'MAGISTRATE',
              },
              { title: 'Ms', surname: 'Beta', forename: 'B', type: 'JUDGE' },
            ],
          },
        ]),
      ],
      false,
    );

    const calls = __instance.text.mock.calls as unknown[][];

    const alphaCall = findTextCallContaining(calls, 'Alpha');
    const betaCall = findTextCallContaining(calls, 'Beta');

    expect(alphaCall).toBeTruthy();
    expect(betaCall).toBeTruthy();

    // If they were rendered in separate doc. text calls, the Y coordinates should differ.
    if (alphaCall !== betaCall) {
      const alphaY = alphaCall?.[2] as number | undefined;
      const betaY = betaCall?.[2] as number | undefined;
      expect(alphaY).toBeDefined();
      expect(betaY).toBeDefined();
      expect(alphaY).not.toBe(betaY);
      return;
    }

    // Otherwise, they were rendered via a single doc.text call with an array of lines.
    const [arg] = alphaCall ?? [];
    expect(Array.isArray(arg)).toBe(true);

    const lines = arg as unknown[];
    const alphaIdx = lines.findIndex(
      (s) => typeof s === 'string' && s.includes('Alpha'),
    );
    const betaIdx = lines.findIndex(
      (s) => typeof s === 'string' && s.includes('Beta'),
    );

    expect(alphaIdx).toBeGreaterThanOrEqual(0);
    expect(betaIdx).toBeGreaterThanOrEqual(0);
    expect(alphaIdx).not.toBe(betaIdx);
  });

  describe('cja name formatter', () => {
    type PrivateFns = {
      cjaName: (raw?: string) => string;
    };

    const priv = (s: PdfService): PrivateFns => s as unknown as PrivateFns;

    it('cjaName: strips leading numeric code + dash and returns the CJA name', () => {
      expect(priv(service).cjaName('01 - CJA Number 1')).toBe('CJA Number 1');
    });

    it('cjaName: handles en-dash/em-dash variants', () => {
      expect(priv(service).cjaName('01 – CJA Number 1')).toBe('CJA Number 1');
      expect(priv(service).cjaName('01 — CJA Number 1')).toBe('CJA Number 1');
    });

    it('cjaName: strips alphanumeric prefixes like A4/123A', () => {
      expect(priv(service).cjaName('A4 - Greater Manchester')).toBe(
        'Greater Manchester',
      );
      expect(priv(service).cjaName('123A - Name')).toBe('Name');
    });

    it('cjaName: keeps hyphenated names that are not alphanumeric prefixes', () => {
      expect(priv(service).cjaName('South-West London')).toBe(
        'South-West London',
      );
      expect(priv(service).cjaName('West - Midlands')).toBe('West - Midlands');
    });

    it('cjaName: trims whitespace around numeric prefix', () => {
      expect(priv(service).cjaName('  123  -  Name  ')).toBe('Name');
    });

    it('cjaName: returns empty string for blank/whitespace input', () => {
      expect(priv(service).cjaName(undefined)).toBe('');
      expect(priv(service).cjaName('   \n\t ')).toBe('');
    });

    it('cjaName: returns original string when no dash is present', () => {
      expect(priv(service).cjaName('CJA Number 1')).toBe('CJA Number 1');
    });

    it('generatePagedApplicationListPdf: uses CJA name (stripped) when courtName is missing', async () => {
      const { __instance } = getJsPDF();

      await service.generatePagedApplicationListPdf({
        courtName: '',
        cja: '01 - CJA Number 1',
        date: '2025-09-17',
        entries: [{}],
      });

      expect(__instance.save).toHaveBeenCalledWith(
        'cja-number-1-2025-09-17-print-page.pdf',
      );
    });

    it('generateContinuousApplicationListsPdf: uses CJA name (stripped) when courtName is missing and CJA is consistent', async () => {
      const { __instance } = getJsPDF();

      await service.generateContinuousApplicationListsPdf(
        [
          makeRawDto({ courtName: '', cja: '01 - CJA Number 1' }),
          makeRawDto({ courtName: '', cja: '01 - CJA Number 1' }),
        ],
        false,
      );

      expect(__instance.save).toHaveBeenCalledWith(
        'cja-number-1-2025-09-17-print-cont.pdf',
      );
    });
  });

  describe('party/address formatting helpers', () => {
    type PrivateFns = {
      formatParty: (p: unknown) => string;
      formatContactDetails: (cd: unknown) => string;
    };

    const priv = (s: PdfService): PrivateFns => s as unknown as PrivateFns;

    it('formatContactDetails: joins nested address parts with commas', () => {
      const cd = {
        address: {
          addressLine1: '10 Downing Street',
          addressLine2: 'Westminster',
          town: 'London',
          postcode: 'SW1A 2AA',
        },
      };

      expect(priv(service).formatContactDetails(cd)).toBe(
        '10 Downing Street, Westminster, London, SW1A 2AA',
      );
    });

    it('formatContactDetails: supports flattened address fields and alternative keys', () => {
      const cd = {
        addressLine1: '1 Main Road',
        townOrCity: 'Manchester',
        postCode: 'M1 1AA',
      };

      expect(priv(service).formatContactDetails(cd)).toBe(
        '1 Main Road, Manchester, M1 1AA',
      );
    });

    it('formatParty: appends address on a new line for a person party', () => {
      const party = {
        person: {
          name: {
            title: 'Mr',
            firstForename: 'John',
            surname: 'Smith',
          },
          contactDetails: {
            address: {
              addressLine1: '5 Example Street',
              town: 'Leeds',
              postcode: 'LS1 1AA',
            },
          },
        },
      };

      expect(priv(service).formatParty(party)).toBe(
        'Mr John Smith\n5 Example Street, Leeds, LS1 1AA',
      );
    });

    it('formatParty: appends address on a new line for an organisation party', () => {
      const party = {
        organisation: {
          name: 'CPS',
          contactDetails: {
            address: {
              addressLine1: '2 Crown Square',
              city: 'Bristol',
              postcode: 'BS1 4AA',
            },
          },
        },
      };

      expect(priv(service).formatParty(party)).toBe(
        'CPS\n2 Crown Square, Bristol, BS1 4AA',
      );
    });

    it('formatParty: returns address-only when no person/org name is available', () => {
      const party = {
        organisation: {
          name: '   ',
          contactDetails: {
            address: {
              addressLine1: '100 High Street',
            },
          },
        },
      };

      expect(priv(service).formatParty(party)).toBe('100 High Street');
    });
  });

  describe('PdfService safeFormatDate', () => {
    type PrivateFns = {
      safeFormatDate: (raw?: string, format?: string) => string;
    };

    const priv = (s: PdfService): PrivateFns => s as unknown as PrivateFns;

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-17T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const call = (value: unknown, fmt: string) =>
      priv(service).safeFormatDate(value as string, fmt);

    it('falls back to today when value is undefined', () => {
      const expected = formatDate(new Date(), 'longDate', 'en-GB');
      expect(call(undefined, 'longDate')).toBe(expected);
    });

    it('falls back to today when value is an empty string', () => {
      const expected = formatDate(new Date(), 'longDate', 'en-GB');
      expect(call('', 'longDate')).toBe(expected);
    });

    it('falls back to today when value is whitespace', () => {
      const expected = formatDate(new Date(), 'longDate', 'en-GB');
      expect(call('   ', 'longDate')).toBe(expected);
    });

    it('returns formatted date for a valid ISO string', () => {
      expect(call('2026-06-06', 'longDate')).toBe(
        formatDate('2026-06-06', 'longDate', 'en-GB'),
      );
    });

    it('returns formatted date for a Date object', () => {
      const d = new Date('2026-06-06T00:00:00.000Z');
      expect(call(d, 'longDate')).toBe(formatDate(d, 'longDate', 'en-GB'));
    });

    it('falls back to today when value is not parseable', () => {
      const expected = formatDate(new Date(), 'longDate', 'en-GB');
      expect(call('not-a-date', 'longDate')).toBe(expected);
    });
  });
});
