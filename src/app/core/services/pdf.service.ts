import { Injectable } from '@angular/core';
import { RowInput } from 'jspdf-autotable';

type SafeRec = Record<string, unknown>;
interface PdfList {
  id: string;
  courtName?: string;
  listDate?: string;
  location?: string;
  entries: {
    applicant?: string;
    respondent?: string;
    matter?: string;
    result?: string;
    judge?: string;
    date?: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class PdfService {
  async generateApplicationListPdf(dto: unknown, opts?: { crestUrl?: string }): Promise<void> {
    const data = this.normalise(dto);

    const [{ jsPDF }, autoTableMod] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const autoTable = (autoTableMod as any).default ?? (autoTableMod as any);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const marginX = 56; // ~ govuk-spacing(7)
    const marginTop = 56;

    // Try to load crest if provided; it's fine if it fails
    const crestDataUrl = opts?.crestUrl
      ? await this.tryLoadImageAsDataUrl(opts.crestUrl)
      : null;

    const header = () => {
      // Crest + Court name
      if (crestDataUrl) {
        try {
          doc.addImage(crestDataUrl, 'PNG', marginX, marginTop - 32, 32, 32);
        } catch {
          // ignore image errors
        }
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(this.fallbackText(data.courtName, 'Court'), marginX + (crestDataUrl ? 40 : 0), marginTop);

      // List metadata line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const meta =
        `Date: ${this.fallbackText(data.listDate)}   ` +
        `Location: ${this.fallbackText(data.location)}   ` +
        `List ID: ${data.id}`;
      doc.text(meta, marginX, marginTop + 22);
    };

    // Draw header once before table
    header();

    // Table of entries
    const head = [['Applicant', 'Respondent', 'Matter considered', 'Result', 'Judge', 'Date']];
    const rows: RowInput[] = data.entries.map(e => [
      this.fallbackText(e.applicant),
      this.fallbackText(e.respondent),
      this.fallbackText(e.matter),
      this.fallbackText(e.result),
      this.fallbackText(e.judge),
      this.fallbackText(e.date),
    ]);

    autoTable(doc, {
      head,
      body: rows,
      startY: marginTop + 36,
      margin: { left: marginX, right: marginX },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, lineWidth: 0.3 },
      headStyles: { fillColor: [240, 240, 240] },
      didDrawPage: () => {
        header(); // repeat header on every page
        // Footer: "Produced on: DD/MM/YYYY"
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = String(today.getFullYear());
        const producedOn = `Produced on: ${dd}/${mm}/${yyyy}`;
        doc.setFontSize(9);
        doc.text(producedOn, marginX, doc.internal.pageSize.getHeight() - 28);
      },
    });

    doc.save(`application-list-${data.id}.pdf`);
  }

  // --- helpers ---

  private normalise(dto: unknown): PdfList {
    const obj = (dto ?? {}) as SafeRec;

    const id = String(obj['id'] ?? '');
    const listDate =
      this.asStr(obj['date']) || this.asStr(obj['listDate']) || this.asStr(obj['hearingDate']);
    const courtName = this.asStr(obj['courtName']) || this.asStr(obj['court']);
    const location = this.asStr(obj['location']) || this.asStr(obj['courthouse']);

    const entries = Array.isArray(obj['entries']) ? (obj['entries'] as SafeRec[]) : [];

    const mapped = entries.map((x) => ({
      applicant: this.asStr(x['applicant']) || this.asStr(x['applicantName']),
      respondent: this.asStr(x['respondent']) || this.asStr(x['respondentName']),
      matter: this.asStr(x['matter']) || this.asStr(x['matterConsidered']),
      result: this.composeResult(x),
      judge: this.asStr(x['judge']) || this.asStr(x['judgeName']),
      date: this.asStr(x['date']) || this.asStr(x['listDate']),
    }));

    return {
      id,
      courtName,
      listDate,
      location,
      entries: mapped,
    };
  }

  private composeResult(x: SafeRec): string {
    const result = this.asStr(x['result']) || this.asStr(x['outcome']) || '';
    const referral = this.asStr(x['referralWording']) || '';
    return referral ? `${result} — ${referral}` : result;
  }

  private asStr(v: unknown): string {
    return typeof v === 'string' && v.trim().length ? v : '';
  }

  private fallbackText(v?: string, fallback = ''): string {
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
