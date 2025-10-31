// Central PDF types for the app. Keep this file dependency-light.

export type JsPDFLike = {
  splitTextToSize: (text: string, width: number) => string | string[];
  text: (
    text: string | string[],
    x: number,
    y: number,
    opts?: { align?: 'left' | 'right' | 'center' },
  ) => void;
  setFont: (family: string, style?: string) => void;
  setFontSize: (size: number) => void;
  setLineWidth: (w: number) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  addPage: () => void;
  addImage: (
    dataUrl: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  save: (filename: string) => void;
};

/**
 * Minimal doc shape needed by low-level helpers (pdf-utils).
 * Keeps utils decoupled from the full jsPDF surface.
 */
export type PdfDocLike = Pick<
  JsPDFLike,
  'splitTextToSize' | 'text' | 'setFontSize' | 'setLineWidth' | 'line'
>;

export interface PdfList {
  id: string;
  courtName?: string;
  listDate?: string;
  location?: string;
  entries: {
    applicant?: string;
    respondent?: string;
    applicationCode?: string;
    applicationDescription?: string;
    matter?: string;
    result?: string;
    judge?: string;
    date?: string;
    caseReference?: string;
    accountReference?: string;
    notes?: string;
  }[];
}
