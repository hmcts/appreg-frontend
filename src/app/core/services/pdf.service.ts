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

    // --- layout metrics tuned to legacy look ---
    const M = 56; // outer margin
    const TOP = M + 64; // content start (below header rule)
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const LABEL_W = 140; // left column label width
    const GAP_X = 20; // gap between label & value columns
    const RIGHT_X = M + LABEL_W + GAP_X;
    const RIGHT_W = pageW - RIGHT_X - M;

    const FOOTER_GUTTER = 64; // reserved space above footer labels
    const BOTTOM = pageH - M - FOOTER_GUTTER;

    // --- optional crest ---
    let crestDataUrl: string | null = null;
    if (opts?.crestUrl) {
      crestDataUrl = await this.tryLoadImageAsDataUrl(opts.crestUrl);
    }

    // --- helpers (local to renderer) ---
    const hr = (y: number) => {
      doc.setLineWidth(0.7);
      doc.line(M, y, pageW - M, y);
    };
    const drawHeader = () => {
      if (crestDataUrl) {
        try {
          doc.addImage(crestDataUrl, 'PNG', M, M - 6, 48, 48);
        } catch {
          /* ignore */
        }
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(
        this.fallbackText(data.courtName, 'Magistrates’ Court'),
        pageW / 2,
        M + 12,
        { align: 'center' },
      );
      hr(M + 36);
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

    let y = TOP;

    const ensureSpace = (needed: number) => {
      if (y + needed <= BOTTOM) {
        return;
      }
      doc.addPage();
      drawHeader();
      y = TOP;
    };

    // Left label + right value (single right column)
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

    data.entries.forEach((e, i) => {
      if (i === 0) {
        drawHeader();
      } else {
        doc.addPage();
        drawHeader();
      }
      y = TOP;

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

      // 3) Matter considered: heading + code in SAME right column
      const heading = this.fallbackText(e.matter);
      const code = this.fallbackText(e.code ?? '');
      writeLabelValue('Matter considered', heading);
      writeLabelValue(code, this.fallbackText(e.description));
      writeLabelValue('', this.fallbackText(e.result));

      ensureSpace(36);
      hr(y);
      y += 24;

      writeLabelValue('This matter was dated before', e.date);

      drawFooter();
    });

    doc.save(`application-list-${data.id}.pdf`);
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

    const person = this.asObj(root['person']);
    if (person) {
      // prefer a preformatted full name
      const full =
        this.asStr(person['fullName']) ||
        this.asStr(person['full-name']) ||
        this.asStr(this.asObj(person['fullName'])?.['formatted']) ||
        this.asStr(this.asObj(person['full-name'])?.['formatted']);
      if (full.trim()) {
        return full.trim();
      }

      // fall back to parts (support legacy & hyphenated keys)
      const name =
        this.asObj(person['name']) ?? this.asObj(person['full-name']) ?? {};
      const parts = [
        this.asStr(name['title']),
        this.asStr(name['firstForename']) || this.asStr(name['forename']),
        this.asStr(name['secondForename']) || this.asStr(name['middleNames']),
        this.asStr(name['thirdForename']),
        this.asStr(name['surname']),
      ].filter(Boolean);

      const combined = parts.join(' ').replace(/\s+/g, ' ').trim();
      if (combined) {
        return combined;
      }
    }

    const org = this.asObj(root['organisation']);
    const orgName = this.asStr(org?.['name']);
    return orgName.trim();
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
}
