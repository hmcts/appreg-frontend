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

    const [{ jsPDF }] = await Promise.all([import('jspdf')]);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    // --- layout metrics (original layout retained) ---
    const M = 56; // outer margin
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const LABEL_W = 140; // left column label width
    const GAP_X = 20; // gap between label & value columns
    const RIGHT_X = M + LABEL_W + GAP_X;
    const RIGHT_W = pageW - RIGHT_X - M;

    const FOOTER_GUTTER = 64; // reserved space above footer labels
    const BOTTOM = pageH - M - FOOTER_GUTTER;

    // Header sizing (only changes here: bigger crest + larger body gap)
    const TITLE_FS = 18;
    const CREST_W = 72; // bigger crest (was 48)
    const CREST_H = 72; // bigger crest (was 48)
    const CREST_X = M;
    const CREST_Y = M - 6; // keep your original slight vertical offset
    const HEADER_BODY_GAP = 56; // larger gap before the first field

    // --- optional crest ---
    let crestDataUrl: string | null = null;
    if (opts?.crestUrl) {
      crestDataUrl = await this.tryLoadImageAsDataUrl(opts.crestUrl);
    }

    // Track the measured top-of-page for content (replaces fixed TOP)
    let pageTop = 0;
    let y = 0;

    // --- helpers (local to renderer) ---
    const hr = (yy: number) => {
      doc.setLineWidth(0.7);
      doc.line(M, yy, pageW - M, yy);
    };

    // Draw header; return content start Y (under rule + gap)
    const drawHeader = (): number => {
      // crest
      if (crestDataUrl) {
        try {
          doc.addImage(crestDataUrl, 'PNG', CREST_X, CREST_Y, CREST_W, CREST_H);
        } catch {
          /* ignore */
        }
      }

      // court name centered and vertically aligned to crest box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(TITLE_FS);

      const title = this.fallbackText(data.courtName, 'Magistrates’ Court');
      const titleLines = doc.splitTextToSize(title, pageW - 2 * M); // allow wrapping if needed
      const lineH = TITLE_FS * 1.2;
      const blockH = Math.max(lineH, titleLines.length * lineH);

      const crestMidY = CREST_Y + CREST_H / 2;
      const titleFirstBaselineY = crestMidY - blockH / 2 + TITLE_FS * 0.85;

      doc.text(titleLines, pageW / 2, titleFirstBaselineY, { align: 'center' });

      // rule under taller of crest or title
      const titleBottomBaseline =
        titleFirstBaselineY + (titleLines.length - 1) * lineH;
      const headerBottom = Math.max(CREST_Y + CREST_H, titleBottomBaseline) + 8;

      hr(headerBottom);
      return headerBottom + HEADER_BODY_GAP; // bigger gap before data
    };

    const drawFooter = () => {
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

    const ensureSpace = (needed: number) => {
      if (y + needed <= BOTTOM) {
        return;
      }
      doc.addPage();
      pageTop = drawHeader();
      y = pageTop;
    };

    // Left label + right value (single right column) — original block
    const writeLabelValue = (
      labelText: string,
      valueText: string | undefined,
      optsLV?: { emphasize?: boolean; spacing?: number },
    ) => {
      const spacing = optsLV?.spacing ?? 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      const labelLines = doc.splitTextToSize(labelText, LABEL_W);
      const labelH = labelLines.length * 14;

      const valueToUse = valueText && valueText.trim() ? valueText : '—';
      doc.setFont('helvetica', optsLV?.emphasize ? 'bold' : 'normal');
      doc.setFontSize(12);
      const valueLines = doc.splitTextToSize(valueToUse, RIGHT_W);
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

    // ---------------- render (everything else unchanged) ----------------
    data.entries.forEach((e, i) => {
      if (i === 0) {
        pageTop = drawHeader();
      } else {
        doc.addPage();
        pageTop = drawHeader();
      }
      y = pageTop; // start body at measured top with larger gap

      // 1) Application brought by / Respondent
      writeLabelValue(
        'Application\nbrought by',
        this.fallbackText(e.applicant),
        { spacing: 8 },
      );
      writeLabelValue('Respondent', this.fallbackText(e.respondent));

      // 2) Divider rule
      ensureSpace(36);
      hr(y);
      y += 24;

      // 3) Matter considered: heading + code as a LABEL (original format)
      const heading = this.fallbackText(e.matter);
      const code = this.fallbackText(e.code ?? '');
      writeLabelValue('Matter considered', heading);
      writeLabelValue(code, this.fallbackText(e.description));
      writeLabelValue('', this.fallbackText(e.result));

      // 4) Second divider rule
      ensureSpace(36);
      hr(y);
      y += 24;

      // 5) Dated row
      writeLabelValue('This matter was dated before', e.date);

      drawFooter();
    });

    // -------- filename: include court name + date (YYYY-MM-DD) --------
    const courtPart = this.fileSafe(data.courtName) || 'court';
    const datePart = this.dateForFile(data.listDate);
    doc.save(`${courtPart}-${datePart}.pdf`);
  }

  // ------------------------- Mapping & utilities -------------------------

  /** Map raw print DTO (nested structures) into flat strings the renderer expects. */
  private normalise(dto: unknown): PdfList {
    const root = this.asObj(dto) ?? {};

    const id = String(root['id'] ?? '');

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

      // Single-field "matter" kept for compatibility (prefer description then code)
      const matter = applicationDescription || applicationCode;

      const result = this.asArr(x['resultWordings'])
        .map(this.asStr)
        .filter(Boolean)
        .join(' ');

      const judge = this.asArr(x['officials'])
        .map(this.asStr)
        .filter(Boolean)
        .join(', ');

      // Use list date for per-entry date
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

  /** Resolve a display name from person/organisation shapes in the print DTO. */
  private formatParty(p: unknown): string {
    const root = this.asObj(p);
    if (!root) {
      return '';
    }

    // Person preferred
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

      const full = parts
        .join(' ')
        .replace(/[,\s]+$/g, '')
        .trim();
      if (full) {
        return full;
      }
    }

    // Organisation fallback
    const org = this.asObj(root['organisation']);
    const orgName = this.cleanPart(org?.['name']);
    return orgName;
  }

  /** Treat common placeholder tokens as empty; trim and collapse spaces. */
  private cleanPart(v: unknown): string {
    if (typeof v !== 'string') return '';
    const t = v.trim();
    if (!t) return '';
    const lower = t.toLowerCase();
    // Add/remove tokens as needed for your mocks
    const placeholders = new Set([
      'string',
      'n/a',
      'na',
      'null',
      'undefined',
      '-',
      '—',
    ]);
    if (placeholders.has(lower)) return '';
    return t.replace(/\s+/g, ' ');
  }

  /** Titles like "Mr, Mrs" → pick first meaningful token ("Mr"). */
  private firstTitleToken(s?: unknown): string {
    const c = this.cleanPart(s);
    if (!c) return '';
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
      if (!p) continue;
      if (
        out.length === 0 ||
        out[out.length - 1].toLowerCase() !== p.toLowerCase()
      ) {
        out.push(p);
      }
    }
    return out;
  }

  // --- tiny guards ---
  private asObj(v: unknown): Record<string, unknown> | null {
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  }

  private asArr(v: unknown): unknown[] {
    return Array.isArray(v) ? v : [];
  }

  private asStr(v: unknown): string {
    return typeof v === 'string' ? v : '';
  }

  private fallbackText(v?: string, fallback = '—'): string {
    return v && v.trim().length ? v : fallback;
  }

  private async tryLoadImageAsDataUrl(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('image read error'));
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  // --- filename helpers ---
  /** Make a safe, compact filename part from free text. */
  private fileSafe(s?: string): string {
    const raw = (s ?? '').trim();
    if (!raw) return '';
    return raw
      .replace(/\s+/g, ' ') // collapse whitespace
      .replace(/[^\w\s-]+/g, '') // remove punctuation/symbols
      .trim()
      .replace(/\s+/g, '-') // spaces -> hyphens
      .toLowerCase();
  }

  /** Prefer ISO input (YYYY-MM-DD); else fall back to today's date in that format. */
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
