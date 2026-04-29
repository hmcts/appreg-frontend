export type PrintRequest = {
  id: string;
  mode: 'page' | 'continuous';
};

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

export type ApplicationListPdfGenerator = {
  generatePagedApplicationListPdf: (
    dto: unknown,
    opts?: { crestUrl?: string },
  ) => Promise<void>;
  generateContinuousApplicationListsPdf: (
    dtos: unknown[],
    isClosed: boolean,
  ) => Promise<void>;
};

export type ApplicationListPrintErrorHandler = (message: string) => void;

export type PrintApplicationListOptions = {
  pdf: ApplicationListPdfGenerator;
  isBrowser: boolean;
  onError: ApplicationListPrintErrorHandler;
  noEntriesMessage: string;
};

export type PrintApplicationListPageOptions = PrintApplicationListOptions & {
  generateErrorMessage: string;
  crestUrl?: string;
};

export type PrintApplicationListContinuousOptions =
  PrintApplicationListOptions & {
    generateErrorMessage: string;
    isClosed?: boolean;
  };
