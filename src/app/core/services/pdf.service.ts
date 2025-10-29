import { Injectable } from '@angular/core';

interface PdfList {
  id: string;
  courtName?: string;
  listDate?: string;
  location?: string;
  entries: {
    applicant?: string;
    respondent?: string;
    code?: string;
    description?: string;
    matter?: string;
    result?: string;
    judge?: string;
    date?: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class PdfService {
  async generateApplicationListPdf(
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

      const heading = this.fallbackText(e.description || e.matter);
      writeLabelValue('Matter considered', heading);
      if (e.code?.trim()) {
        writeLabelValue(e.code, this.fallbackText(e.result));
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
        this.asStr(x['applicationCode']) || this.asStr(x['code']);

      const applicationDescription =
        this.asStr(x['applicationWording']) ||
        this.asStr(x['applicationTitle']);

      const matter = applicationDescription || applicationCode;

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
        code: applicationCode,
        description: applicationDescription,
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
