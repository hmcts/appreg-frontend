import { PdfService } from '../../../../../src/app/core/services/pdf.service';

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
  it('names the file as "<court-name>-<YYYY-MM-DD>.pdf" (fileSafe + exact date)', async () => {
    const svc = new PdfService();
    const { __instance } = getJsPDF();

    await svc.generatePagedApplicationListPdf({
      courtName: 'Bath Magistrates Court',
      date: '2025-09-17',
      entries: [{}],
    });

    expect(__instance.save).toHaveBeenCalledTimes(1);
    expect(__instance.save.mock.calls[0][0]).toBe(
      'bath-magistrates-court-2025-09-17.pdf',
    );
  });

  it('falls back to "court-<today>.pdf" when courtName/date are missing', async () => {
    const svc = new PdfService();
    const { __instance } = getJsPDF();

    await svc.generatePagedApplicationListPdf({
      entries: [{}],
    });

    expect(__instance.save).toHaveBeenCalledWith('court-2025-09-17.pdf');
  });

  it('creates one page per entry (addPage called for each additional entry)', async () => {
    const svc = new PdfService();
    const { __instance } = getJsPDF();

    await svc.generatePagedApplicationListPdf({
      courtName: 'X',
      date: '2025-09-17',
      entries: [{}, {}, {}],
    });

    expect(__instance.addPage).toHaveBeenCalledTimes(2);
  });

  it('renders header labels and footer date (produced on)', async () => {
    const svc = new PdfService();

    await svc.generatePagedApplicationListPdf({
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
    expect(textCallsContain('Produced on:')).toBe(true);
    expect(anyTextCallMatches(/\b\d{2}\/\d{2}\/\d{4}\b/)).toBe(true);
  });

  it('prints the application code row only when code is non-empty', async () => {
    const svc = new PdfService();

    await svc.generatePagedApplicationListPdf({
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
    const svc = new PdfService();
    const { __instance } = getJsPDF();

    const spy = jest
      .spyOn(
        svc as unknown as {
          tryLoadImageAsDataUrl: (u: string) => Promise<string | null>;
        },
        'tryLoadImageAsDataUrl',
      )
      .mockResolvedValue('data:image/png;base64,AAA');

    await svc.generatePagedApplicationListPdf(
      { courtName: 'X', date: '2025-09-17', entries: [{}] },
      { crestUrl: '/assets/govuk-crest.png' },
    );

    expect(spy).toHaveBeenCalledWith('/assets/govuk-crest.png');
    expect(__instance.addImage).toHaveBeenCalledTimes(1);
  });

  it('skips crest image if crestUrl is omitted or load fails', async () => {
    const svc = new PdfService();
    const { __instance } = getJsPDF();

    // No crestUrl
    await svc.generatePagedApplicationListPdf({ entries: [{}] });
    expect(__instance.addImage).toHaveBeenCalledTimes(0);

    // crestUrl provided but loader returns null
    jest
      .spyOn(
        svc as unknown as {
          tryLoadImageAsDataUrl: (u: string) => Promise<string | null>;
        },
        'tryLoadImageAsDataUrl',
      )
      .mockResolvedValueOnce(null);

    await svc.generatePagedApplicationListPdf(
      { entries: [{}] },
      { crestUrl: '/x.png' },
    );
    expect(__instance.addImage).toHaveBeenCalledTimes(0);
  });
});

describe('PdfService.generateContinuousApplicationListsPdf', () => {
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
    const svc = new PdfService();
    const { jsPDF } = getJsPDF();

    await svc.generateContinuousApplicationListsPdf([makeRawDto()]);

    expect(jsPDF).toHaveBeenCalledWith({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });
    expect(textCallsContain('Check List Report')).toBe(true);
    expect(textCallsContain('Page 1')).toBe(true);
  });

  it('names file "<court>-continuous-<YYYY-MM-DD>.pdf" when all lists share the same court', async () => {
    const svc = new PdfService();
    const { __instance } = getJsPDF();

    await svc.generateContinuousApplicationListsPdf([
      makeRawDto({ courtName: 'Bath Magistrates Court' }),
      makeRawDto({ courtName: 'Bath Magistrates Court' }),
    ]);

    expect(__instance.save).toHaveBeenCalledTimes(1);
    expect(__instance.save).toHaveBeenCalledWith(
      'bath-magistrates-court-continuous-2025-09-17.pdf',
    );
  });

  it('names file "applications-continuous-<YYYY-MM-DD>.pdf" when courts differ or are missing', async () => {
    const svc = new PdfService();
    const { __instance } = getJsPDF();

    await svc.generateContinuousApplicationListsPdf([
      makeRawDto({ courtName: 'Bath Magistrates Court' }),
      makeRawDto({ courtName: 'Bristol Crown Court' }),
      makeRawDto({ courtName: '' }),
    ]);

    expect(__instance.save).toHaveBeenCalledTimes(1);
    expect(__instance.save).toHaveBeenCalledWith(
      'applications-continuous-2025-09-17.pdf',
    );
  });

  it('adds a new page and increments page number when content exceeds available space', async () => {
    const svc = new PdfService();
    const { __instance } = getJsPDF();

    // Force a very short page height so ensureSpace() triggers
    const originalGetHeight = __instance.internal.pageSize.getHeight;
    __instance.internal.pageSize.getHeight = () => 180; // tiny to guarantee breaks

    try {
      // Make one DTO with an entry that has a very tall "Notes" block
      const tallNotes = new Array(50).fill('line').join('\n');
      await svc.generateContinuousApplicationListsPdf([
        makeRawDto({}, [
          {
            applicant: { person: { name: { forename: 'A', surname: 'S' } } },
            respondent: { organisation: { name: 'Org' } },
            notes: tallNotes,
          },
        ]),
      ]);

      expect(__instance.addPage).toHaveBeenCalled(); // at least once
      expect(textCallsContain('Page 2')).toBe(true);
    } finally {
      __instance.internal.pageSize.getHeight = originalGetHeight;
    }
  });

  it('renders the top meta row and application blocks (labels + values)', async () => {
    const svc = new PdfService();

    await svc.generateContinuousApplicationListsPdf([
      makeRawDto({}, [
        {
          applicant: { person: { name: { forename: 'Jane', surname: 'Roe' } } },
          respondent: { organisation: { name: 'Widgets Ltd' } },
          applicationCode: 'AP01',
          applicationTitle: 'Interim Relief',
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
    ]);

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
    expect(textCallsContain('Account Reference: ACC-9')).toBe(true);
    expect(textCallsContain('Application Title: Interim Relief')).toBe(true);

    // Judge name appears in the "This matter was before" row
    expect(textCallsContain('Taylor')).toBe(true);
    expect(textCallsContain('Hugh')).toBe(true);
    expect(textCallsContain('MAGISTRATE')).toBe(true);
  });

  it('renders multiple officials on separate lines (one per object)', async () => {
    const svc = new PdfService();
    const { __instance } = getJsPDF();

    await svc.generateContinuousApplicationListsPdf([
      makeRawDto({}, [
        {
          applicant: { person: { name: { forename: 'Jane', surname: 'Roe' } } },
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
    ]);

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

  describe('party/address formatting helpers', () => {
    type PrivateFns = {
      formatParty: (p: unknown) => string;
      formatContactDetails: (cd: unknown) => string;
    };

    const priv = (s: PdfService): PrivateFns => s as unknown as PrivateFns;

    it('formatContactDetails: joins nested address parts with commas', () => {
      const svc = new PdfService();

      const cd = {
        address: {
          addressLine1: '10 Downing Street',
          addressLine2: 'Westminster',
          town: 'London',
          postcode: 'SW1A 2AA',
        },
      };

      expect(priv(svc).formatContactDetails(cd)).toBe(
        '10 Downing Street, Westminster, London, SW1A 2AA',
      );
    });

    it('formatContactDetails: supports flattened address fields and alternative keys', () => {
      const svc = new PdfService();

      const cd = {
        addressLine1: '1 Main Road',
        townOrCity: 'Manchester',
        postCode: 'M1 1AA',
      };

      expect(priv(svc).formatContactDetails(cd)).toBe(
        '1 Main Road, Manchester, M1 1AA',
      );
    });

    it('formatParty: appends address on a new line for a person party', () => {
      const svc = new PdfService();

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

      expect(priv(svc).formatParty(party)).toBe(
        'Mr John Smith\n5 Example Street, Leeds, LS1 1AA',
      );
    });

    it('formatParty: appends address on a new line for an organisation party', () => {
      const svc = new PdfService();

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

      expect(priv(svc).formatParty(party)).toBe(
        'CPS\n2 Crown Square, Bristol, BS1 4AA',
      );
    });

    it('formatParty: returns address-only when no person/org name is available', () => {
      const svc = new PdfService();

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

      expect(priv(svc).formatParty(party)).toBe('100 High Street');
    });
  });
});
