import { Injectable } from '@angular/core';

import { asArr, asObj, asStrOrNum } from '../../shared/util/data-utils';
import {
  drawHr,
  drawTextBlock,
  extractDuration as extractDurationFromDto,
  toLines,
} from '../../shared/util/pdf-utils';
import { normaliseTime } from '../../shared/util/time-helpers';
import {
  JsPDFLike,
  PdfList,
} from '../../shared/util/types/pdf-service/pdf-types';

import { trimToString } from '@util/string-helpers';

@Injectable({ providedIn: 'root' })
export class PdfService {
  /**
   * Single-entry, paged layout (portrait).
   * Intentionally mirrors the continuous layout’s typography where sensible.
   */
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

    // Preload the crest once and reuse in every header
    let crestDataUrl: string | null = null;
    if (opts?.crestUrl) {
      crestDataUrl = await this.tryLoadImageAsDataUrl(opts.crestUrl);
    }

    let pageTop = 0;
    let y = 0;

    const hrLocal = (yy: number): void => {
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
      const titleLines = toLines(
        doc as unknown as JsPDFLike,
        title,
        pageW - 2 * M,
      );
      const lineH = TITLE_FS * 1.2;
      const blockH = Math.max(lineH, titleLines.length * lineH);

      const crestMidY = CREST_Y + CREST_H / 2;
      const titleFirstBaselineY = crestMidY - blockH / 2 + TITLE_FS * 0.85;

      doc.text(titleLines, pageW / 2, titleFirstBaselineY, { align: 'center' });

      const titleBottomBaseline =
        titleFirstBaselineY + (titleLines.length - 1) * lineH;
      const headerBottom = Math.max(CREST_Y + CREST_H, titleBottomBaseline) + 8;

      hrLocal(headerBottom);
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
      const labelLines = toLines(
        doc as unknown as JsPDFLike,
        labelText,
        LABEL_W,
      );
      const labelH = labelLines.length * 14;

      const valueToUse = valueText?.trim() ? valueText : '—';
      doc.setFont('helvetica', optsLV?.emphasize ? 'bold' : 'normal');
      doc.setFontSize(12);
      const valueLines = toLines(
        doc as unknown as JsPDFLike,
        valueToUse,
        RIGHT_W,
      );
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
      hrLocal(y);
      y += 24;

      const heading = this.fallbackText(e.applicationDescription || e.matter);
      writeLabelValue('Matter considered', heading);

      if (e.applicationCode?.trim()) {
        writeLabelValue(e.applicationCode, this.fallbackText(e.result));
      }

      ensureSpace(36);
      hrLocal(y);
      y += 24;

      writeLabelValue('This matter was dated before', e.date);

      drawFooter();
    }

    const courtPart = this.fileSafe(data.courtName) || 'court';
    const datePart = this.dateForFile(data.listDate);
    doc.save(`${courtPart}-${datePart}.pdf`);
  }

  /**
   * Multi-entry, continuous layout (landscape).
   * Uses a two-column grid; labels are short and values wrap.
   */
  async generateContinuousApplicationListsPdf(dtos: unknown[]): Promise<void> {
    const dataArr = dtos.map((d) => this.normalise(d));

    const jsPDFMod = await import('jspdf');
    const { jsPDF } = jsPDFMod;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    }) as unknown as JsPDFLike;

    // --- page metrics (A4 landscape) ---
    const M = 40; // outer margin
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // 2-column grid inside the content area
    const COL_GAP = 28;
    const GRID_W = pageW - 2 * M;
    const COL_W = Math.floor((GRID_W - COL_GAP) / 2);
    const COL1_X = M;
    const COL2_X = M + COL_W + COL_GAP;

    const IN_LABEL_W = 120; // inner label width
    const IN_GAP = 10;

    const FOOTER_GUTTER = 40;
    const BOTTOM = pageH - M - FOOTER_GUTTER;

    // Type ramp & leading
    const TITLE_FS = 20;
    const LABEL_FS = 12;
    const VALUE_FS = 12;
    const LABEL_LEADING = LABEL_FS + 2;
    const VALUE_LEADING = VALUE_FS + 4;

    let y = 0;
    let pageNo = 0;

    const hr = (yy: number) => drawHr(doc, Math.round(yy), M, pageW);

    const drawHeader = (): void => {
      pageNo += 1;

      const HEADER_BOTTOM_PAD = 25;

      const headerY = Math.round(M + TITLE_FS);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(TITLE_FS);
      doc.text('Check List Report', M, headerY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(LABEL_FS + 1);
      doc.text(`Page ${pageNo}`, pageW - M, headerY, { align: 'right' });

      y = Math.round(headerY + HEADER_BOTTOM_PAD);
    };

    const ensureSpace = (needed: number): void => {
      if (y + needed <= BOTTOM) {
        return;
      }
      doc.addPage();
      drawHeader();
    };

    const drawTwoColRow = (
      leftLabel: string,
      leftValue: string,
      rightLabel: string,
      rightValue: string,
      spacing = 14,
      padY = 0, // inner vertical padding
    ): void => {
      doc.setFont('helvetica', 'bold');
      const leftLabelLines = toLines(doc, leftLabel, IN_LABEL_W);
      const rightLabelLines = toLines(doc, rightLabel, IN_LABEL_W);

      doc.setFont('helvetica', 'normal');
      const leftValLines = toLines(doc, leftValue, COL_W - IN_LABEL_W - IN_GAP);
      const rightValLines = toLines(
        doc,
        rightValue,
        COL_W - IN_LABEL_W - IN_GAP,
      );

      const leftH = Math.max(
        leftLabelLines.length * LABEL_LEADING,
        leftValLines.length * VALUE_LEADING,
      );
      const rightH = Math.max(
        rightLabelLines.length * LABEL_LEADING,
        rightValLines.length * VALUE_LEADING,
      );

      const contentH = Math.max(leftH, rightH);
      const blockH = contentH + padY * 2;

      ensureSpace(blockH);

      const yy = Math.round(y + padY);

      // LEFT column
      doc.setFont('helvetica', 'bold');
      drawTextBlock(doc, leftLabelLines, COL1_X, yy, LABEL_FS, LABEL_LEADING);
      doc.setFont('helvetica', 'normal');
      drawTextBlock(
        doc,
        leftValLines,
        COL1_X + IN_LABEL_W + IN_GAP,
        yy,
        VALUE_FS,
        VALUE_LEADING,
      );

      // RIGHT column
      doc.setFont('helvetica', 'bold');
      drawTextBlock(doc, rightLabelLines, COL2_X, yy, LABEL_FS, LABEL_LEADING);
      doc.setFont('helvetica', 'normal');
      drawTextBlock(
        doc,
        rightValLines,
        COL2_X + IN_LABEL_W + IN_GAP,
        yy,
        VALUE_FS,
        VALUE_LEADING,
      );

      y = Math.round(y + blockH + spacing);
    };

    const drawFullRow = (label: string, value: string, spacing = 14): void => {
      doc.setFont('helvetica', 'bold');
      const labLines = toLines(doc, label, IN_LABEL_W);
      doc.setFont('helvetica', 'normal');
      const valLines = toLines(
        doc,
        value,
        pageW - (COL1_X + IN_LABEL_W + IN_GAP) - M,
      );

      const blockH = Math.max(
        labLines.length * LABEL_LEADING,
        valLines.length * VALUE_LEADING,
      );
      ensureSpace(blockH);

      doc.setFont('helvetica', 'bold');
      drawTextBlock(doc, labLines, COL1_X, y, LABEL_FS, LABEL_LEADING);
      doc.setFont('helvetica', 'normal');
      drawTextBlock(
        doc,
        valLines,
        COL1_X + IN_LABEL_W + IN_GAP,
        y,
        VALUE_FS,
        VALUE_LEADING,
      );

      y = Math.round(y + blockH + spacing);
    };

    drawHeader();

    let entryIndex = 0;
    for (let li = 0; li < dataArr.length; li += 1) {
      const data = dataArr[li];
      const raw = dtos[li];

      // Top meta row (LEFT: Date & Time + Duration; RIGHT: Location)
      const normalisedTime = normaliseTime(data.listTime ?? '');

      const dateTime = this.fallbackText(data.listDate + ' ' + normalisedTime); // YYYY-MM-DD HH:MM
      const duration = this.fallbackText(extractDurationFromDto(raw), '—');
      const leftLabels = 'Date & Time\nDuration';
      const leftValues = `${dateTime}\n${duration}`;
      const location = this.fallbackText(data.courtName || data.location, '—');

      if (entryIndex > 0) {
        ensureSpace(20);
        hr(y);
        y = Math.round(y + 14);
      }

      drawTwoColRow(leftLabels, leftValues, 'Location', location, 18, 6);

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

        // Application (left/right blocks)
        const leftBlockParts: string[] = [];
        if (e.caseReference?.trim()) {
          leftBlockParts.push(`Case Reference: ${e.caseReference.trim()}`);
        }
        if (e.applicationCode?.trim()) {
          leftBlockParts.push(`Application Code: ${e.applicationCode.trim()}`);
        }
        const leftBlock = leftBlockParts.join('\n');

        const rightBlockParts: string[] = [];
        if (e.accountReference?.trim()) {
          rightBlockParts.push(
            `Account Reference: ${e.accountReference.trim()}`,
          );
        }
        if (e.applicationDescription?.trim()) {
          rightBlockParts.push(
            `Application Title: ${e.applicationDescription.trim()}`,
          );
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

  // -------------------- Mapping helpers --------------------

  private normalise(dto: unknown): PdfList {
    const root = asObj(dto) ?? {};

    const id = asStrOrNum(root['id']);

    const listDate =
      trimToString(root['date']) ||
      trimToString(root['listDate']) ||
      trimToString(root['hearingDate']);

    const listTime =
      trimToString(root['time']) || trimToString(root['listTime']);

    const courtName =
      trimToString(root['courtName']) || trimToString(root['court']);

    const location =
      trimToString(root['otherLocationDescription']) ||
      trimToString(root['location']) ||
      trimToString(root['courthouse']);

    const srcEntries = asArr(root['entries']);

    const entries = srcEntries.map((raw) => {
      const x = asObj(raw) ?? {};

      const applicant = this.formatParty(x['applicant']);
      const respondent = this.formatParty(x['respondent']);

      // Fallback to "code" if applicationCode is absent (bugfix).
      const applicationCode =
        trimToString(x['applicationCode']) || trimToString(x['code']);

      const applicationTitle = trimToString(x['applicationTitle']);
      const applicationWording = trimToString(x['applicationWording']);

      const caseReference =
        trimToString(x['caseReference']) ||
        trimToString(x['caseRef']) ||
        trimToString(x['caseNumber']);

      const accountReference =
        trimToString(x['accountReference']) ||
        trimToString(x['accountRef']) ||
        trimToString(x['accountNumber']);

      const applicationDescription = applicationTitle || '';
      const matter = applicationWording || applicationCode;
      const notes = trimToString(x['notes']);

      const result = asArr(x['resultWordings'])
        .map((v) => trimToString(v))
        .filter(Boolean)
        .join(' ');

      const judge = asArr(x['officials'])
        .map((v) => trimToString(v))
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

    return { id, courtName, listDate, listTime, location, entries };
  }

  /** Person/organisation display name with placeholder cleanup. */
  private formatParty(p: unknown): string {
    const root = asObj(p);
    if (!root) {
      return '';
    }

    const person = asObj(root['person']);
    const org = asObj(root['organisation']);
    const dob = this.cleanPart(root['dateOfBirth']);

    const contactDetails =
      (org ? org['contactDetails'] : undefined) ??
      (person ? person['contactDetails'] : undefined);

    const address = this.formatContactDetails(contactDetails, dob);

    if (person) {
      const name = asObj(person['name']) ?? asObj(person['full-name']) ?? {};
      // Assemble the usual suspects; trim out placeholder tokens.
      const parts = this.dedupeParts([
        this.firstTitleToken(name?.['title']),
        this.cleanPart(name?.['firstForename'] ?? name?.['forename']),
        this.cleanPart(name?.['secondForename'] ?? name?.['middleNames']),
        this.cleanPart(name?.['thirdForename']),
        this.cleanPart(name?.['surname']),
      ]).filter(Boolean);

      const full = parts.join(' ').trim();
      if (full) {
        return address ? `${full}\n${address}` : full;
      }
    }

    const orgName = this.cleanPart(org?.['name']);
    if (orgName) {
      return address ? `${orgName}\n${address}` : orgName;
    }

    return address;
  }

  private formatContactDetails(cd: unknown, dob?: string): string {
    const cdObj = asObj(cd);
    const addrObj = cdObj ? (asObj(cdObj['address']) ?? cdObj) : null;

    const addressParts: string[] = addrObj
      ? [
          this.cleanPart(
            addrObj['addressLine1'] ?? addrObj['line1'] ?? addrObj['address1'],
          ),
          this.cleanPart(
            addrObj['addressLine2'] ?? addrObj['line2'] ?? addrObj['address2'],
          ),
          this.cleanPart(
            addrObj['addressLine3'] ?? addrObj['line3'] ?? addrObj['address3'],
          ),
          this.cleanPart(
            addrObj['town'] ?? addrObj['townOrCity'] ?? addrObj['city'],
          ),
          this.cleanPart(addrObj['county']),
          this.cleanPart(addrObj['postcode'] ?? addrObj['postCode']),
        ].filter((s) => s.length > 0)
      : [];

    const addressLine = addressParts.join(', ');

    const email = cdObj
      ? this.cleanPart(
          cdObj['emailAddress'] ?? cdObj['email'] ?? cdObj['email_address'],
        )
      : '';
    const phone = cdObj
      ? this.cleanPart(
          cdObj['phoneNumber'] ??
            cdObj['telephoneNumber'] ??
            cdObj['phone'] ??
            cdObj['telephone'],
        )
      : '';
    const mobile = cdObj
      ? this.cleanPart(
          cdObj['mobileNumber'] ??
            cdObj['mobilePhoneNumber'] ??
            cdObj['mobile'],
        )
      : '';

    const contactLines: string[] = [];

    if (dob) {
      contactLines.push(`Date Of Birth: ${dob}`);
    }
    if (email) {
      contactLines.push(`Email: ${email}`);
    }
    if (phone) {
      contactLines.push(`Phone: ${phone}`);
    }
    if (mobile) {
      contactLines.push(`Mobile: ${mobile}`);
    }

    if (!addressLine) {
      return contactLines.join('\n');
    }

    return contactLines.length > 0
      ? `${addressLine}\n${contactLines.join('\n')}`
      : addressLine;
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
    // Collapse internal whitespace to single spaces; this reads better in PDF cells.
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
      .replaceAll(/[^\w\s-]+/g, '')
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
