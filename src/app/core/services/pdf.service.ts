import { Injectable } from '@angular/core';

interface PdfList {
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

@Injectable({ providedIn: 'root' })
export class PdfService {
  async generatePagedApplicationListPdf(
    dto: unknown,
    opts?: { crestUrl?: string },
  ): Promise<void> {
    const data = this.normalise(dto);

    const jsPDFMod = await import('jspdf');
    const { jsPDF } = jsPDFMod;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    // --- layout constants ---
    const M = 56;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const LABEL_W = 140;
    const GAP_X = 20;
    const RIGHT_X = M + LABEL_W + GAP_X;
    const RIGHT_W = pageW - RIGHT_X - M;

    const FOOTER_GUTTER = 64;
    const BOTTOM = pageH - M - FOOTER_GUTTER;

    const TITLE_FS = 18;
    const CREST_W = 72;
    const CREST_H = 72;
    const CREST_X = M;
    const CREST_Y = M - 6;
    const HEADER_BODY_GAP = 56;

    const splitToLines = (text: string, width: number): string[] => {
      const raw: unknown = doc.splitTextToSize(text, width);

      if (typeof raw === 'string') {
        return [raw];
      }

      if (Array.isArray(raw)) {
        return (raw as unknown[]).filter(
          (x): x is string => typeof x === 'string',
        );
      }
      return [''];
    };

    let crestDataUrl: string | null = null;
    if (opts?.crestUrl) {
      crestDataUrl = await this.tryLoadImageAsDataUrl(opts.crestUrl);
    }

    let pageTop = 0;
    let y = 0;

    const hr = (yy: number): void => {
      doc.setLineWidth(0.7);
      doc.line(M, yy, pageW - M, yy);
    };

    // Header renders crest + centred title and returns body start Y
    const drawHeader = (): number => {
      if (crestDataUrl) {
        try {
          doc.addImage(crestDataUrl, 'PNG', CREST_X, CREST_Y, CREST_W, CREST_H);
        } catch {
          /* ignore */
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(TITLE_FS);

      const title = this.fallbackText(data.courtName, 'Court Missing');
      const titleLines = splitToLines(title, pageW - 2 * M);
      const lineH = TITLE_FS * 1.2;
      const blockH = Math.max(lineH, titleLines.length * lineH);

      const crestMidY = CREST_Y + CREST_H / 2;
      const titleFirstBaselineY = crestMidY - blockH / 2 + TITLE_FS * 0.85;

      doc.text(titleLines, pageW / 2, titleFirstBaselineY, { align: 'center' });

      const titleBottomBaseline =
        titleFirstBaselineY + (titleLines.length - 1) * lineH;
      const headerBottom = Math.max(CREST_Y + CREST_H, titleBottomBaseline) + 8;

      hr(headerBottom);
      return headerBottom + HEADER_BODY_GAP;
    };

    const drawFooter = (): void => {
      const baseY = pageH - M - 22;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Produced on:', M, baseY);

      const today = new Date();
      const todayDMY =
        `${String(today.getDate()).padStart(2, '0')}/` +
        `${String(today.getMonth() + 1).padStart(2, '0')}/` +
        `${today.getFullYear()}`;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(todayDMY, RIGHT_X, baseY);
    };

    const ensureSpace = (needed: number): void => {
      if (y + needed <= BOTTOM) {
        return;
      }
      doc.addPage();
      pageTop = drawHeader();
      y = pageTop;
    };

    // Left label + right value; all text arrays are string[]
    const writeLabelValue = (
      labelText: string,
      valueText: string | undefined,
      optsLV?: { emphasize?: boolean; spacing?: number },
    ): void => {
      const spacing = optsLV?.spacing ?? 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const labelLines = splitToLines(labelText, LABEL_W);
      const labelH = labelLines.length * 14;

      const valueToUse = valueText?.trim() ? valueText : '—';
      doc.setFont('helvetica', optsLV?.emphasize ? 'bold' : 'normal');
      doc.setFontSize(12);
      const valueLines = splitToLines(valueToUse, RIGHT_W);
      const valueH = valueLines.length * 16;

      ensureSpace(Math.max(labelH, valueH));

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(labelLines, M, y);

      doc.setFont('helvetica', optsLV?.emphasize ? 'bold' : 'normal');
      doc.setFontSize(12);
      doc.text(valueLines, RIGHT_X, y);

      y += Math.max(labelH, valueH) + spacing;
    };

    // Render (use for…of instead of .forEach)
    for (const [i, e] of data.entries.entries()) {
      if (i === 0) {
        pageTop = drawHeader();
      } else {
        doc.addPage();
        pageTop = drawHeader();
      }
      y = pageTop;

      writeLabelValue(
        'Application\nbrought by',
        this.fallbackText(e.applicant),
        { spacing: 8 },
      );
      writeLabelValue('Respondent', this.fallbackText(e.respondent));

      ensureSpace(36);
      hr(y);
      y += 24;

      const heading = this.fallbackText(e.applicationDescription || e.matter);
      writeLabelValue('Matter considered', heading);

      if (e.applicationCode?.trim()) {
        writeLabelValue(e.applicationCode, this.fallbackText(e.result));
      }

      ensureSpace(36);
      hr(y);
      y += 24;

      writeLabelValue('This matter was dated before', e.date);

      drawFooter();
    }

    const courtPart = this.fileSafe(data.courtName) || 'court';
    const datePart = this.dateForFile(data.listDate);
    doc.save(`${courtPart}-${datePart}.pdf`);
  }

  async generateContinuousApplicationListsPdf(dtos: unknown[]): Promise<void> {
    const dataArr = dtos.map((d) => this.normalise(d));

    const jsPDFMod = await import('jspdf');
    const { jsPDF } = jsPDFMod;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    // --- page metrics ---
    const M = 40; // outer margin
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // 2-column grid
    const COL_GAP = 28;
    const GRID_W = pageW - 2 * M;
    const COL_W = Math.floor((GRID_W - COL_GAP) / 2);
    const COL1_X = M;
    const COL2_X = M + COL_W + COL_GAP;

    // Inside each column: label+value
    const IN_LABEL_W = 120;
    const IN_GAP = 10;

    // Footer reserve
    const FOOTER_GUTTER = 40;
    const BOTTOM = pageH - M - FOOTER_GUTTER;

    // Type ramp & leading
    const TITLE_FS = 20;
    const LABEL_FS = 12;
    const VALUE_FS = 12;
    const LABEL_LEADING = LABEL_FS + 2;
    const VALUE_LEADING = VALUE_FS + 4;

    // Helpers
    const snap = (yy: number) => Math.round(yy);

    const toLines = (text: string, width: number): string[] => {
      const t = text.trim();
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
    };

    const hr = (yy: number): void => {
      const yLine = snap(yy);
      doc.setLineWidth(0.7);
      doc.line(M, yLine, pageW - M, yLine);
    };

    let y = 0;
    let pageNo = 0;

    const drawHeader = (): void => {
      pageNo += 1;

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(TITLE_FS);
      doc.text('Check List Report', M, snap(M + TITLE_FS));

      // Page number on the right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(LABEL_FS + 1);
      doc.text(`Page ${pageNo}`, pageW - M, snap(M + TITLE_FS), {
        align: 'right',
      });

      y = snap(M + TITLE_FS + 18);
    };

    const ensureSpace = (needed: number): void => {
      if (y + needed <= BOTTOM) {
        return;
      }
      doc.addPage();
      drawHeader();
    };

    const drawTextBlock = (
      linesArr: string[],
      x: number,
      baseY: number,
      fs: number,
      leading: number,
    ) => {
      if (!linesArr.length) {
        return 0;
      }
      doc.setFontSize(fs);
      linesArr.forEach((ln, idx) => {
        const yy = snap(baseY + idx * leading);
        doc.text(ln, x, yy);
      });
      return linesArr.length * leading;
    };

    const drawTwoColRow = (
      leftLabel: string,
      leftValue: string,
      rightLabel: string,
      rightValue: string,
      spacing = 14,
    ): void => {
      doc.setFont('helvetica', 'bold');
      const leftLabelLines = toLines(leftLabel, IN_LABEL_W);
      const rightLabelLines = toLines(rightLabel, IN_LABEL_W);

      doc.setFont('helvetica', 'normal');
      const leftValLines = toLines(leftValue, COL_W - IN_LABEL_W - IN_GAP);
      const rightValLines = toLines(rightValue, COL_W - IN_LABEL_W - IN_GAP);

      const leftH = Math.max(
        leftLabelLines.length * LABEL_LEADING,
        leftValLines.length * VALUE_LEADING,
      );
      const rightH = Math.max(
        rightLabelLines.length * LABEL_LEADING,
        rightValLines.length * VALUE_LEADING,
      );
      const blockH = Math.max(leftH, rightH);

      ensureSpace(blockH);

      const leftColumnTop = y;
      doc.setFont('helvetica', 'bold');
      drawTextBlock(
        leftLabelLines,
        COL1_X,
        leftColumnTop,
        LABEL_FS,
        LABEL_LEADING,
      );
      doc.setFont('helvetica', 'normal');
      drawTextBlock(
        leftValLines,
        COL1_X + IN_LABEL_W + IN_GAP,
        leftColumnTop,
        VALUE_FS,
        VALUE_LEADING,
      );

      const rightColumnTop = y;
      doc.setFont('helvetica', 'bold');
      drawTextBlock(
        rightLabelLines,
        COL2_X,
        rightColumnTop,
        LABEL_FS,
        LABEL_LEADING,
      );

      doc.setFont('helvetica', 'normal');
      drawTextBlock(
        rightValLines,
        COL2_X + IN_LABEL_W + IN_GAP,
        rightColumnTop,
        VALUE_FS,
        VALUE_LEADING,
      );

      y = snap(y + blockH + spacing);
    };

    const drawFullRow = (label: string, value: string, spacing = 14): void => {
      doc.setFont('helvetica', 'bold');
      const labLines = toLines(label, IN_LABEL_W);
      doc.setFont('helvetica', 'normal');
      const valLines = toLines(
        value,
        pageW - (COL1_X + IN_LABEL_W + IN_GAP) - M,
      );

      const blockH = Math.max(
        labLines.length * LABEL_LEADING,
        valLines.length * VALUE_LEADING,
      );

      ensureSpace(blockH);

      doc.setFont('helvetica', 'bold');
      drawTextBlock(labLines, COL1_X, y, LABEL_FS, LABEL_LEADING);

      doc.setFont('helvetica', 'normal');
      drawTextBlock(
        valLines,
        COL1_X + IN_LABEL_W + IN_GAP,
        y,
        VALUE_FS,
        VALUE_LEADING,
      );

      y = snap(y + blockH + spacing);
    };

    const extractDuration = (raw: unknown): string => {
      const root = this.asObj(raw) ?? {};
      return (
        this.asStr(root['duration']) ||
        this.asStr(root['listDuration']) ||
        this.asStr(root['hearingDuration']) ||
        this.asStr(root['sessionDuration'])
      );
    };

    drawHeader();

    let entryIndex = 0;
    for (let li = 0; li < dataArr.length; li += 1) {
      const data = dataArr[li];
      const raw = dtos[li];

      const dateTime = this.fallbackText(data.listDate || '', '—');
      const duration = this.fallbackText(extractDuration(raw), '—');
      const leftLabels = 'Date & Time\nDuration';
      const leftValues = `${dateTime}\n${duration}`;
      const location = this.fallbackText(data.courtName || data.location, '—');

      if (entryIndex > 0) {
        ensureSpace(20);
        hr(y);
        y = snap(y + 14);
      }

      drawTwoColRow(leftLabels, leftValues, 'Location', location, 18);

      for (const e of data.entries) {
        entryIndex += 1;

        // Applicant / Respondent
        const applicant = this.fallbackText(e.applicant);
        const respondent = this.fallbackText(e.respondent);
        drawTwoColRow(
          `${entryIndex}. Applicant`,
          applicant,
          'Respondent',
          respondent,
          16,
        );

        const leftBlockParts: string[] = [];
        if (e.caseReference?.trim()) {
          leftBlockParts.push(`Case Reference: ${e.caseReference.trim()}`);
        }
        const codeText = e.applicationCode;
        if (typeof codeText === 'string' && codeText.trim()) {
          leftBlockParts.push(`Application Code: ${codeText.trim()}`);
        }
        const leftBlock = leftBlockParts.join('\n');

        const rightBlockParts: string[] = [];
        if (e.accountReference?.trim()) {
          rightBlockParts.push(
            `Account Reference: ${e.accountReference.trim()}`,
          );
        }
        const descText = e.applicationDescription;
        if (typeof descText === 'string' && descText.trim()) {
          rightBlockParts.push(`Application Title: ${descText.trim()}`);
        }
        const rightBlock = rightBlockParts.join('\n');

        drawTwoColRow('Application', leftBlock || '—', '', rightBlock, 10);

        // Result
        const result = this.fallbackText(e.result);
        drawFullRow('Result', result, 18);

        // Notes
        const notes = this.fallbackText(e.notes);
        drawFullRow('Notes', notes, 22);

        // Judges
        const judges = this.fallbackText(e.judge);
        drawFullRow('This matter was before', judges, 14);
      }
    }

    const uniqueCourts = Array.from(
      new Set(dataArr.map((d) => this.fileSafe(d.courtName)).filter(Boolean)),
    );
    const courtPart =
      uniqueCourts.length === 1 ? uniqueCourts[0] : 'applications';
    const datePart = this.dateForFile();
    doc.save(`${courtPart}-continuous-${datePart}.pdf`);
  }

  private normalise(dto: unknown): PdfList {
    const root = this.asObj(dto) ?? {};

    const id = this.asStrOrNum(root['id']);

    const listDate =
      this.asStr(root['date']) ||
      this.asStr(root['listDate']) ||
      this.asStr(root['hearingDate']);

    const courtName =
      this.asStr(root['courtName']) || this.asStr(root['court']);

    const location =
      this.asStr(root['otherLocationDescription']) ||
      this.asStr(root['location']) ||
      this.asStr(root['courthouse']);

    const srcEntries = this.asArr(root['entries']);

    const entries = srcEntries.map((raw) => {
      const x = this.asObj(raw) ?? {};

      const applicant = this.formatParty(x['applicant']);
      const respondent = this.formatParty(x['respondent']);

      const applicationCode =
        this.asStr(x['applicationCode']) || this.asStr(x['applicationCode']);

      const applicationTitle = this.asStr(x['applicationTitle']);
      const applicationWording = this.asStr(x['applicationWording']);

      const caseReference =
        this.asStr(x['caseReference']) ||
        this.asStr(x['caseRef']) ||
        this.asStr(x['caseNumber']);

      const accountReference =
        this.asStr(x['accountReference']) ||
        this.asStr(x['accountRef']) ||
        this.asStr(x['accountNumber']);

      const applicationDescription = applicationTitle || '';

      const matter = applicationWording || applicationCode;
      const notes = this.asStr(x['notes']);

      const result = this.asArr(x['resultWordings'])
        .map((v) => this.asStr(v))
        .filter(Boolean)
        .join(' ');

      const judge = this.asArr(x['officials'])
        .map((v) => this.asStr(v))
        .filter(Boolean)
        .join(', ');

      const date = listDate;

      return {
        applicant,
        respondent,
        matter,
        result,
        judge,
        date,
        applicationCode,
        applicationDescription,
        caseReference,
        accountReference,
        notes,
      };
    });

    return { id, courtName, listDate, location, entries };
  }

  /** Person/organisation display name with placeholder cleanup. */
  private formatParty(p: unknown): string {
    const root = this.asObj(p);
    if (!root) {
      return '';
    }

    const person = this.asObj(root['person']);
    if (person) {
      const name =
        this.asObj(person['name']) ?? this.asObj(person['full-name']) ?? {};

      const parts = this.dedupeParts([
        this.firstTitleToken(name?.['title']),
        this.cleanPart(name?.['firstForename'] ?? name?.['forename']),
        this.cleanPart(name?.['secondForename'] ?? name?.['middleNames']),
        this.cleanPart(name?.['thirdForename']),
        this.cleanPart(name?.['surname']),
      ]).filter(Boolean);

      const full = parts.join(' ').trim();
      if (full) {
        return full;
      }
    }

    const org = this.asObj(root['organisation']);
    return this.cleanPart(org?.['name']);
  }

  /** Treat common placeholder tokens as empty; trim/collapse spaces. */
  private cleanPart(v: unknown): string {
    if (typeof v !== 'string') {
      return '';
    }
    const t = v.trim();
    if (!t) {
      return '';
    }
    const lower = t.toLowerCase();
    const placeholders = new Set([
      'string',
      'n/a',
      'na',
      'null',
      'undefined',
      '-',
      '—',
    ]);
    if (placeholders.has(lower)) {
      return '';
    }
    // Collapse all internal whitespace to single spaces
    return t.split(/\s+/).join(' ');
  }

  /** Titles like "Mr, Mrs" → pick first meaningful token. */
  private firstTitleToken(s?: unknown): string {
    const c = this.cleanPart(s);
    if (!c) {
      return '';
    }
    const first = c
      .split(/[,/;]+/)
      .map((x) => x.trim())
      .find(Boolean);
    return first ?? '';
  }

  /** De-duplicate consecutive tokens (case-insensitive). */
  private dedupeParts(parts: string[]): string[] {
    const out: string[] = [];
    for (const p of parts) {
      if (!p) {
        continue;
      }
      const last = out.at(-1);
      if (!last || last.toLowerCase() !== p.toLowerCase()) {
        out.push(p);
      }
    }
    return out;
  }

  private asObj(v: unknown): Record<string, unknown> | null {
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  }

  private asArr(v: unknown): unknown[] {
    return Array.isArray(v) ? v : [];
  }

  private asStr(v: unknown): string {
    return typeof v === 'string' ? v : '';
  }

  /** Coerce to string only if it's already string/number. */
  private asStrOrNum(v: unknown): string {
    if (typeof v === 'string') {
      return v;
    }
    if (typeof v === 'number') {
      return String(v);
    }
    return '';
  }

  private fallbackText(v?: string, fallback = '—'): string {
    return v?.trim().length ? v : fallback;
  }

  private async tryLoadImageAsDataUrl(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error('image read error'));
          }
        };
        reader.onerror = () => reject(new Error('image read error'));
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  /** Filename-safe text. */
  private fileSafe(s?: string): string {
    const raw = (s ?? '').trim();
    if (!raw) {
      return '';
    }
    return raw
      .split(/\s+/)
      .join(' ')
      .replace(/[^\w\s-]+/g, '')
      .trim()
      .split(/\s+/)
      .join('-')
      .toLowerCase();
  }

  /** Prefer ISO input; else use today's date (YYYY-MM-DD). */
  private dateForFile(isoMaybe?: string): string {
    if (isoMaybe && /^\d{4}-\d{2}-\d{2}$/.test(isoMaybe)) {
      return isoMaybe;
    }
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
