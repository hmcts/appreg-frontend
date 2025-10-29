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
    // Split on newlines so "Application\nbrought by" becomes ["Application","brought by"]
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

    await svc.generateApplicationListPdf({
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

    await svc.generateApplicationListPdf({
      entries: [{}],
    });

    expect(__instance.save).toHaveBeenCalledWith('court-2025-09-17.pdf');
  });

  it('creates one page per entry (addPage called for each additional entry)', async () => {
    const svc = new PdfService();
    const { __instance } = getJsPDF();

    await svc.generateApplicationListPdf({
      courtName: 'X',
      date: '2025-09-17',
      entries: [{}, {}, {}],
    });

    expect(__instance.addPage).toHaveBeenCalledTimes(2);
  });

  it('renders header labels and footer date (produced on)', async () => {
    const svc = new PdfService();

    await svc.generateApplicationListPdf({
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

    await svc.generateApplicationListPdf({
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

    await svc.generateApplicationListPdf(
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
    await svc.generateApplicationListPdf({ entries: [{}] });
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

    await svc.generateApplicationListPdf(
      { entries: [{}] },
      { crestUrl: '/x.png' },
    );
    expect(__instance.addImage).toHaveBeenCalledTimes(0);
  });
});
