import { Injectable, inject } from '@angular/core';
import { autoTable } from 'jspdf-autotable';

import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import { StandardApplicantPrintDto } from '@openapi';
import { asArr, asObj, asStrOrNum } from '@util/data-utils';
import {
  drawHr,
  drawTextBlock,
  extractDuration as extractDurationFromDto,
  toLines,
} from '@util/pdf-utils';
import { getDateStamp, trimToString } from '@util/string-helpers';
import { normaliseTime } from '@util/time-helpers';
import { JsPDFLike, PdfList } from '@util/types/pdf-service/pdf-types';

const PDF_PAGE_OPTIONS = {
  unit: 'pt',
  format: 'a4',
} as const;
const PDF_FONT = {
  family: 'helvetica',
  bold: 'bold',
  normal: 'normal',
} as const;

const DEFAULT_CONTINUOUS_ROW_SPACING = 14;

const PAGED_APPLICATION_LIST_LAYOUT = {
  margin: 56,
  labelWidth: 140,
  columnGap: 20,
  footerGutter: 64,
  titleFontSize: 18,
  labelFontSize: 11,
  labelLineHeight: 14,
  valueFontSize: 12,
  valueLineHeight: 16,
  crestWidth: 72,
  crestHeight: 72,
  crestYOffset: -6,
  headerBodyGap: 56,
  footerOffset: 22,
} as const;

const CONTINUOUS_APPLICATION_LIST_LAYOUT = {
  margin: 40,
  columnGap: 28,
  labelWidth: 120,
  innerGap: 10,
  footerGutter: 40,
  titleFontSize: 20,
  labelFontSize: 12,
  valueFontSize: 12,
  labelLineHeight: 14,
  valueLineHeight: 16,
  headerBottomPadding: 25,
} as const;

type DrawContinuousTwoColumnRow = (
  leftLabel: string,
  leftValue: string,
  rightLabel: string,
  rightValue: string,
  spacing?: number,
  padY?: number,
) => void;

type DrawContinuousFullRow = (
  label: string,
  value: string,
  spacing?: number,
) => void;

@Injectable({ providedIn: 'root' })
export class PdfService {
  private readonly dateTimePipe = inject(DateTimePipe);

  /**
   * Single-entry, paged layout (portrait).
   * Intentionally mirrors the continuous layout’s typography where sensible.
   */
  async generatePagedApplicationListPdf(
    dto: unknown,
    opts?: { crestUrl?: string },
  ): Promise<void> {
    const dataArr = (Array.isArray(dto) ? dto : [dto]).map((d) =>
      this.normalise(d),
    );

    const jsPDFMod = await import('jspdf');
    const { jsPDF } = jsPDFMod;

    const doc = new jsPDF({
      orientation: 'portrait',
      ...PDF_PAGE_OPTIONS,
    });

    const layout = PAGED_APPLICATION_LIST_LAYOUT;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const rightX = layout.margin + layout.labelWidth + layout.columnGap;
    const rightWidth = pageW - rightX - layout.margin;
    const bottom = pageH - layout.margin - layout.footerGutter;
    const crestX = layout.margin;
    const crestY = layout.margin + layout.crestYOffset;

    // Preload the crest once and reuse in every header
    let crestDataUrl: string | null = null;
    if (opts?.crestUrl) {
      crestDataUrl = await this.tryLoadImageAsDataUrl(opts.crestUrl);
    }

    let pageTop = 0;
    let y = 0;

    const hrLocal = (yy: number): void => {
      doc.setLineWidth(0.7);
      doc.line(layout.margin, yy, pageW - layout.margin, yy);
    };

    // Header renders crest + centred title and returns body start Y
    const drawHeader = (data: PdfList): number => {
      if (crestDataUrl) {
        try {
          doc.addImage(
            crestDataUrl,
            'PNG',
            crestX,
            crestY,
            layout.crestWidth,
            layout.crestHeight,
          );
        } catch {
          /* ignore */
        }
      }

      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      doc.setFontSize(layout.titleFontSize);

      const title = this.fallbackText(
        data.courtName || `${data.location}\n${data.cja}`,
        'Court Missing',
      );
      const titleLines = toLines(doc, title, pageW - 2 * layout.margin);
      const lineH = layout.titleFontSize * 1.2;
      const blockH = Math.max(lineH, titleLines.length * lineH);

      const crestMidY = crestY + layout.crestHeight / 2;
      const titleFirstBaselineY =
        crestMidY - blockH / 2 + layout.titleFontSize * 0.85;

      doc.text(titleLines, pageW / 2, titleFirstBaselineY, { align: 'center' });

      const titleBottomBaseline =
        titleFirstBaselineY + (titleLines.length - 1) * lineH;
      const headerBottom =
        Math.max(crestY + layout.crestHeight, titleBottomBaseline) + 8;

      hrLocal(headerBottom);
      return headerBottom + layout.headerBodyGap;
    };

    const drawFooter = (): void => {
      const baseY = pageH - layout.margin - layout.footerOffset;

      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      doc.setFontSize(layout.labelFontSize);
      doc.text('Produced on', layout.margin, baseY);

      const today = new Date();
      const todayDMY =
        `${String(today.getDate()).padStart(2, '0')}/` +
        `${String(today.getMonth() + 1).padStart(2, '0')}/` +
        `${today.getFullYear()}`;

      doc.setFont(PDF_FONT.family, PDF_FONT.normal);
      doc.setFontSize(layout.valueFontSize);
      doc.text(todayDMY, rightX, baseY);
    };

    const ensureSpace = (needed: number, data: PdfList): void => {
      if (y + needed <= bottom) {
        return;
      }
      doc.addPage();
      pageTop = drawHeader(data);
      y = pageTop;
    };

    // Left label + right value; all text arrays are string[]
    const writeLabelValue = (
      labelText: string,
      valueText: string | undefined,
      data: PdfList,
      optsLV?: { emphasize?: boolean; spacing?: number },
    ): void => {
      const spacing = optsLV?.spacing ?? 12;

      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      doc.setFontSize(layout.labelFontSize);
      const labelLines = toLines(doc, labelText, layout.labelWidth);
      const labelH = labelLines.length * layout.labelLineHeight;

      const valueToUse = valueText?.trim() ? valueText : '—';
      doc.setFont(
        PDF_FONT.family,
        optsLV?.emphasize ? PDF_FONT.bold : PDF_FONT.normal,
      );
      doc.setFontSize(layout.valueFontSize);
      const valueLines = toLines(doc, valueToUse, rightWidth);
      const valueH = valueLines.length * layout.valueLineHeight;

      ensureSpace(Math.max(labelH, valueH), data);

      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      doc.setFontSize(layout.labelFontSize);
      doc.text(labelLines, layout.margin, y);

      doc.setFont(
        PDF_FONT.family,
        optsLV?.emphasize ? PDF_FONT.bold : PDF_FONT.normal,
      );
      doc.setFontSize(layout.valueFontSize);
      doc.text(valueLines, rightX, y);

      y += Math.max(labelH, valueH) + spacing;
    };

    let entryIndex = 0;
    for (const data of dataArr) {
      for (const e of data.entries) {
        if (entryIndex > 0) {
          doc.addPage();
        }
        entryIndex += 1;
        pageTop = drawHeader(data);
        y = pageTop;

        writeLabelValue(
          'Application\nbrought by',
          `${this.fallbackText(e.applicant)}\n${e.accountReference}`,
          data,
          { spacing: 8 },
        );
        writeLabelValue('Respondent', this.fallbackText(e.respondent), data);

        ensureSpace(36, data);
        hrLocal(y);
        y += 24;

        const heading = this.fallbackText(e.applicationDescription);
        writeLabelValue('Matter considered', heading, data);

        writeLabelValue(
          this.fallbackText(e.applicationCode),
          `${this.fallbackText(e.matter)}\n`,
          data,
        );
        writeLabelValue('', this.fallbackText(e.result), data);

        ensureSpace(36, data);
        hrLocal(y);
        y += 24;

        const judges = this.fallbackText(e.judge);
        writeLabelValue('This matter was before', judges, data);

        // date format = 17 Febuary 2026
        const date = this.safeFormatDate(e.date, 'longDate');
        writeLabelValue('Dated', date as string, data);

        drawFooter();
      }
    }

    const uniquePlaces = this.uniqueFileSafePlaces(dataArr);
    let courtPart: string;

    if (uniquePlaces.length === 1) {
      courtPart = uniquePlaces[0];
    } else if (dataArr.length === 1) {
      courtPart = 'court';
    } else {
      courtPart = 'applications';
    }

    const datePart = getDateStamp();
    doc.save(`${courtPart}-${datePart}-print-page.pdf`);
  }

  /**
   * Multi-entry, continuous layout (landscape).
   * Uses a two-column grid; labels are short and values wrap.
   */
  async generateContinuousApplicationListsPdf(
    dtos: unknown[],
    isClosed: boolean,
  ): Promise<void> {
    const dataArr = dtos.map((d) => this.normalise(d));

    const jsPDFMod = await import('jspdf');
    const { jsPDF } = jsPDFMod;
    const doc = new jsPDF({
      orientation: 'landscape',
      ...PDF_PAGE_OPTIONS,
    }) as unknown as JsPDFLike;

    const layout = CONTINUOUS_APPLICATION_LIST_LAYOUT;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const gridWidth = pageW - 2 * layout.margin;
    const columnWidth = Math.floor((gridWidth - layout.columnGap) / 2);
    const secondColumnX = layout.margin + columnWidth + layout.columnGap;
    const bottom = pageH - layout.margin - layout.footerGutter;

    let y = 0;
    let pageNo = 0;

    const pageHeaderTitle = this.getContinuousPageHeader(isClosed);

    const hr = (yy: number) =>
      drawHr(doc, Math.round(yy), layout.margin, pageW);

    const drawHeader = (): void => {
      pageNo += 1;

      const headerY = Math.round(layout.margin + layout.titleFontSize);

      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      doc.setFontSize(layout.titleFontSize);
      doc.text(pageHeaderTitle, layout.margin, headerY);

      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      doc.setFontSize(layout.labelFontSize + 1);
      doc.text(`Page ${pageNo}`, pageW - layout.margin, headerY, {
        align: 'right',
      });

      y = Math.round(headerY + layout.headerBottomPadding);
    };

    const ensureSpace = (needed: number): void => {
      if (y + needed <= bottom) {
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
      spacing = DEFAULT_CONTINUOUS_ROW_SPACING,
      padY = 0, // inner vertical padding
    ): void => {
      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      const leftLabelLines = toLines(doc, leftLabel, layout.labelWidth);
      const rightLabelLines = toLines(doc, rightLabel, layout.labelWidth);

      doc.setFont(PDF_FONT.family, PDF_FONT.normal);
      const valueWidth = columnWidth - layout.labelWidth - layout.innerGap;
      const leftValLines = toLines(doc, leftValue, valueWidth);
      const rightValLines = toLines(doc, rightValue, valueWidth);

      const leftH = Math.max(
        leftLabelLines.length * layout.labelLineHeight,
        leftValLines.length * layout.valueLineHeight,
      );
      const rightH = Math.max(
        rightLabelLines.length * layout.labelLineHeight,
        rightValLines.length * layout.valueLineHeight,
      );

      const contentH = Math.max(leftH, rightH);
      const blockH = contentH + padY * 2;

      ensureSpace(blockH);

      const yy = Math.round(y + padY);

      // LEFT column
      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      drawTextBlock(
        doc,
        leftLabelLines,
        layout.margin,
        yy,
        layout.labelFontSize,
        layout.labelLineHeight,
      );
      doc.setFont(PDF_FONT.family, PDF_FONT.normal);
      drawTextBlock(
        doc,
        leftValLines,
        layout.margin + layout.labelWidth + layout.innerGap,
        yy,
        layout.valueFontSize,
        layout.valueLineHeight,
      );

      // RIGHT column
      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      drawTextBlock(
        doc,
        rightLabelLines,
        secondColumnX,
        yy,
        layout.labelFontSize,
        layout.labelLineHeight,
      );
      doc.setFont(PDF_FONT.family, PDF_FONT.normal);
      drawTextBlock(
        doc,
        rightValLines,
        secondColumnX + layout.labelWidth + layout.innerGap,
        yy,
        layout.valueFontSize,
        layout.valueLineHeight,
      );

      y = Math.round(y + blockH + spacing);
    };

    const drawFullRow = (
      label: string,
      value: string,
      spacing = DEFAULT_CONTINUOUS_ROW_SPACING,
    ): void => {
      const valueW =
        pageW -
        (layout.margin + layout.labelWidth + layout.innerGap) -
        layout.margin;

      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      const labLines = toLines(doc, label, layout.labelWidth);

      doc.setFont(PDF_FONT.family, PDF_FONT.normal);
      const valLines = this.toLinesPreserveBlanks(doc, value, valueW);

      const blockH = Math.max(
        labLines.length * layout.labelLineHeight,
        valLines.length * layout.valueLineHeight,
      );
      ensureSpace(blockH);

      doc.setFont(PDF_FONT.family, PDF_FONT.bold);
      drawTextBlock(
        doc,
        labLines,
        layout.margin,
        y,
        layout.labelFontSize,
        layout.labelLineHeight,
      );

      doc.setFont(PDF_FONT.family, PDF_FONT.normal);
      drawTextBlock(
        doc,
        valLines,
        layout.margin + layout.labelWidth + layout.innerGap,
        y,
        layout.valueFontSize,
        layout.valueLineHeight,
      );

      y = Math.round(y + blockH + spacing);
    };

    drawHeader();
    this.renderContinuousApplicationLists(
      dataArr,
      dtos,
      () => {
        ensureSpace(20);
        hr(y);
        y = Math.round(y + 14);
      },
      drawTwoColRow,
      drawFullRow,
    );

    const uniquePlaces = this.uniqueFileSafePlaces(dataArr);

    const courtPart =
      uniquePlaces.length === 1 ? uniquePlaces[0] : 'applications';
    const datePart = getDateStamp();
    doc.save(`${courtPart}-${datePart}-print-cont.pdf`);
  }

  async generateStandardApplicantsPdf(
    dto: StandardApplicantPrintDto,
  ): Promise<void> {
    if (!dto) {
      return;
    }

    const jsPDFMod = await import('jspdf');
    const { jsPDF } = jsPDFMod;
    const doc = new jsPDF({
      orientation: 'portrait',
      ...PDF_PAGE_OPTIONS,
    }) as unknown as JsPDFLike;

    const margin = 36;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const columnWidth = (pageWidth - margin * 2) / 4;

    doc.setFont(PDF_FONT.family, PDF_FONT.normal);
    doc.setFontSize(11);
    doc.text('Standard applicants report', margin, 51);

    const criteria = this.standardApplicantSearchCriteria(dto.searchCriteria);
    if (criteria) {
      doc.text(`Search criteria: ${criteria}`, margin, 71);
    }

    const labels = [
      ['Code', 'Use from'],
      ['Name', 'Use to'],
      ['Title', 'Address line 1'],
      ['Forename 1', 'Address line 2'],
      ['Forename 2', 'Address line 3'],
      ['Forename 3', 'Address line 4'],
      ['Surname', 'Address line 5'],
      ['Email address', 'Postcode'],
      ['Telephone number', 'Mobile number'],
    ] as const;

    const rows = dto.applicants ?? [];
    let startY = criteria ? 89 : 69;

    for (const applicant of rows) {
      const body = labels.map(([leftLabel, rightLabel]) => [
        leftLabel,
        this.standardApplicantValue(applicant, leftLabel),
        rightLabel,
        this.standardApplicantValue(applicant, rightLabel),
      ]);

      autoTable(doc, {
        body,
        startY,
        margin: { left: margin, right: margin, top: margin, bottom: margin },
        tableWidth: pageWidth - margin * 2,
        pageBreak: 'auto',
        rowPageBreak: 'avoid',
        theme: 'grid',
        styles: {
          font: PDF_FONT.family,
          fontStyle: PDF_FONT.normal,
          fontSize: 10.5,
          cellPadding: { top: 3.5, right: 5, bottom: 3.5, left: 5 },
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          textColor: [0, 0, 0],
          overflow: 'linebreak',
        },
        columnStyles: {
          0: { cellWidth: columnWidth },
          1: { cellWidth: columnWidth },
          2: { cellWidth: columnWidth },
          3: { cellWidth: columnWidth },
        },
      });

      const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } })
        .lastAutoTable?.finalY;
      startY = (finalY ?? pageHeight - margin) + 20;
    }

    const todaysDate = getDateStamp();
    doc.save(`standard-applicant-pdf-${todaysDate}.pdf`);
  }

  // -------------------- Mapping helpers --------------------

  private renderContinuousApplicationLists(
    dataArr: PdfList[],
    dtos: unknown[],
    drawListDivider: () => void,
    drawTwoColRow: DrawContinuousTwoColumnRow,
    drawFullRow: DrawContinuousFullRow,
  ): void {
    let entryIndex = 0;

    for (let listIndex = 0; listIndex < dataArr.length; listIndex += 1) {
      const data = dataArr[listIndex];
      const raw = dtos[listIndex];

      if (entryIndex > 0) {
        drawListDivider();
      }

      this.drawContinuousListHeader(data, raw, drawTwoColRow);

      for (const entry of data.entries) {
        entryIndex += 1;
        this.drawContinuousEntry(entry, entryIndex, drawTwoColRow, drawFullRow);
      }
    }
  }

  private drawContinuousListHeader(
    data: PdfList,
    raw: unknown,
    drawTwoColRow: DrawContinuousTwoColumnRow,
  ): void {
    const normalisedTime = normaliseTime(data.listTime ?? '');
    const date = this.safeFormatDate(data.listDate);
    const dateTime = this.fallbackText(`${date} ${normalisedTime}`);
    const duration = this.fallbackText(extractDurationFromDto(raw), '—');
    const location = this.fallbackText(
      data.courtName || `${data.location}\n${data.cja}`,
      '-',
    );

    drawTwoColRow(
      'Date & Time\nDuration',
      `${dateTime}\n${duration}`,
      'Location',
      location,
      18,
      6,
    );
  }

  private drawContinuousEntry(
    entry: PdfList['entries'][number],
    entryIndex: number,
    drawTwoColRow: DrawContinuousTwoColumnRow,
    drawFullRow: DrawContinuousFullRow,
  ): void {
    drawTwoColRow(
      `${entryIndex}. Applicant`,
      this.fallbackText(entry.applicant),
      'Respondent',
      this.fallbackText(entry.respondent),
      16,
    );
    drawTwoColRow(
      'Application',
      this.continuousApplicationContents(entry),
      'This matter was before',
      this.fallbackText(entry.judge),
      20,
    );
    drawFullRow('Result', this.fallbackText(entry.result), 18);
    drawFullRow('Notes', this.continuousNotes(entry), 22);
  }

  private continuousApplicationContents(
    entry: PdfList['entries'][number],
  ): string {
    return [
      entry.applicationCode?.trim()
        ? `Application Code: ${entry.applicationCode.trim()}`
        : null,
      entry.applicationDescription?.trim()
        ? `Application Title: ${entry.applicationDescription.trim()}`
        : null,
      entry.matter?.trim() || null,
    ]
      .filter((part): part is string => Boolean(part))
      .join('\n');
  }

  private continuousNotes(entry: PdfList['entries'][number]): string {
    const notes = this.fallbackText(entry.notes).trim();
    const referenceLines = [
      entry.accountReference?.trim()
        ? `Account Reference: ${entry.accountReference.trim()}`
        : null,
      entry.caseReference?.trim()
        ? `Case Reference: ${entry.caseReference.trim()}`
        : null,
    ].filter((line): line is string => Boolean(line));

    return [
      notes,
      ...(referenceLines.length ? ['', ...referenceLines] : []),
    ].join('\n');
  }

  private toLinesPreserveBlanks(
    doc: JsPDFLike,
    text: string,
    valueWidth: number,
  ): string[] {
    const normalisedText = (text ?? '').replaceAll('\r\n', '\n');
    if (!normalisedText.trim()) {
      return [];
    }

    const lines: string[] = [];

    for (const rawLine of normalisedText.split('\n')) {
      // Preserve an explicit blank line as vertical space.
      if (rawLine.trim() === '') {
        lines.push(' ');
        continue;
      }

      const wrapped: unknown = doc.splitTextToSize(rawLine, valueWidth);

      if (typeof wrapped === 'string') {
        lines.push(wrapped);
      } else if (Array.isArray(wrapped)) {
        lines.push(
          ...(wrapped as unknown[])
            .filter((line): line is string => typeof line === 'string')
            // keep end spacing irrelevant
            .map((line) => line.trimEnd()),
        );
      }
    }

    return lines;
  }

  private standardApplicantSearchCriteria(
    criteria: StandardApplicantPrintDto['searchCriteria'] | null | undefined,
  ): string {
    if (!criteria) {
      return '';
    }

    return [
      ['Code', criteria.code],
      ['Name', criteria.name],
    ]
      .filter(([, value]) => value?.trim())
      .map(([label, value]) => `${label}: ${value}`)
      .join(', ');
  }

  private standardApplicantValue(
    applicant: StandardApplicantPrintDto['applicants'][number],
    label: string,
  ): string {
    const fieldByLabel: Record<string, keyof typeof applicant> = {
      Code: 'code',
      'Use from': 'useFrom',
      Name: 'name',
      'Use to': 'useTo',
      Title: 'title',
      'Address line 1': 'addressLine1',
      'Forename 1': 'forename1',
      'Address line 2': 'addressLine2',
      'Forename 2': 'forename2',
      'Address line 3': 'addressLine3',
      'Forename 3': 'forename3',
      'Address line 4': 'addressLine4',
      Surname: 'surname',
      'Address line 5': 'addressLine5',
      'Email address': 'emailAddress',
      Postcode: 'postcode',
      'Telephone number': 'telephoneNumber',
      'Mobile number': 'mobileNumber',
    };
    const field = fieldByLabel[label];
    const value = field ? applicant[field] : null;

    if (value === null || value === undefined) {
      return '—';
    }

    if (field === 'useFrom' || field === 'useTo') {
      return this.dateTimePipe.transform(value) ?? '—';
    }

    return String(value);
  }

  private uniqueFileSafePlaces(dataArr: PdfList[]): string[] {
    return Array.from(
      new Set(
        dataArr
          .map(
            (d) =>
              this.fileSafe(d.courtName) || this.fileSafe(this.cjaName(d.cja)),
          )
          .filter((place): place is string => Boolean(place)),
      ),
    );
  }

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
      trimToString(root['courtName']) ||
      trimToString(root['court']) ||
      trimToString(root['courthouse']);

    const location =
      trimToString(root['otherLocationDescription']) ||
      trimToString(root['location']);

    const cja = trimToString(root['cja']);

    const srcEntries = asArr(root['entries']);

    const entries = srcEntries.map((raw) => {
      const x = asObj(raw) ?? {};

      const applicant = this.formatParty(x['applicant']);
      const respondent = this.formatParty(x['respondent']);

      // Fallback to "code" if applicationCode is absent (bugfix).
      const applicationCode =
        trimToString(x['applicationCode']) || trimToString(x['code']);

      const applicationTitle = trimToString(x['applicationTitle']);
      const applicationWording = trimToString(x['applicationWording'])
        .replaceAll(/[{}]/g, '')
        .trim();

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
        .map((v) => trimToString(v).replaceAll(/[{}]/g, '').trim())
        .filter(Boolean)
        .join('\n');

      const judge = asArr(x['officials'])
        .map((v) => {
          const asText = trimToString(v);
          if (asText) {
            return asText;
          }

          const obj = asObj(v);
          if (!obj) {
            return '';
          }

          // One-line per object
          return Object.values(obj)
            .map((val) => {
              if (val === null) {
                return '';
              }
              if (typeof val === 'string') {
                return val.trim();
              }
              if (typeof val === 'number' || typeof val === 'boolean') {
                return String(val);
              }
              return JSON.stringify(val);
            })
            .filter(Boolean)
            .join(' ')
            .replaceAll(/\s+/g, ' ')
            .trim();
        })
        .filter(Boolean)
        .join('\n'); // one object per line

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

    return { id, courtName, listDate, listTime, location, cja, entries };
  }

  /** Person/organisation display name with placeholder cleanup. */
  private formatParty(p: unknown): string {
    const root = asObj(p);
    if (!root) {
      return '';
    }

    const person = asObj(root['person']);
    const org = asObj(root['organisation']);
    const dob =
      this.dateTimePipe.transform(
        this.cleanPart(person?.['dateOfBirth']),
        'mediumDate',
      ) ?? undefined;

    const contactDetails =
      (org ? org['contactDetails'] : undefined) ??
      (person ? person['contactDetails'] : undefined);

    const address = this.formatContactDetails(contactDetails, dob);

    if (person) {
      const name = asObj(person['name']) ?? asObj(person['full-name']) ?? {};
      // Assemble the usual suspects; trim out placeholder tokens.
      const parts = this.dedupeParts([
        this.firstTitleToken(name?.['title']),
        this.cleanPart(
          name?.['firstName'] ?? name?.['forename'] ?? name?.['firstForename'],
        ),
        this.cleanPart(name?.['middleName'] ?? name?.['secondForename']),
        this.cleanPart(name?.['lastName'] ?? name?.['surname']),
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
    return t.replaceAll(/\s+/g, ' ');
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
      if (last?.toLowerCase() !== p.toLowerCase()) {
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
      .replaceAll(/\s+/g, ' ')
      .replaceAll(/[^\w\s-]+/g, '')
      .trim()
      .replaceAll(/\s+/g, '-')
      .toLowerCase();
  }

  private cjaName(raw?: string): string {
    const cjaString = (raw ?? '').trim();
    if (!cjaString) {
      return '';
    }

    // Remove CJA code "A4 - Name"
    if (cjaString.length > 300) {
      // Constrain string length
      return cjaString;
    }

    const match =
      /^\s{0,10}[A-Za-z]?\d{1,6}[A-Za-z]?\s{0,5}[-–—]\s{0,5}(.{1,200})$/u.exec(
        cjaString,
      );
    return match ? match[1].trim() : cjaString;
  }

  private safeFormatDate(
    value: string | Date | undefined,
    format: 'mediumDate' | 'longDate' = 'mediumDate',
  ): string | null {
    const todaysDate = new Date().toISOString().slice(0, 10);
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return this.dateTimePipe.transform(todaysDate, format);
    }

    try {
      return this.dateTimePipe.transform(value as string, format);
    } catch {
      // fallback to today's date
      return this.dateTimePipe.transform(todaysDate, format);
    }
  }

  private getContinuousPageHeader(isClosed: boolean): string {
    return isClosed ? 'Applications Register Report' : 'Check List Report';
  }
}
