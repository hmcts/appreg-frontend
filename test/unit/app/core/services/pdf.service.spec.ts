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
        officials: ['Judge Dredd'],
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
          officials: ['HHJ Taylor'],
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
    expect(textCallsContain('HHJ Taylor')).toBe(true);
  });
});
