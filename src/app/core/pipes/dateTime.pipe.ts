/**
 * Takes an ISO date string and converts to a human readable date.
 * Uses angular DatePipe default presets but we convert to en-gb
 *
 * Formats:
 *  shortDate - 28/6/26
 *  mediumDate - 28 Jun 2026
 *  longDate - 28 June 2026
 *  fullDate - Sunday, 28 June 2026
 *  mediumDateTime - 28 Jun 2026 at 14:30
 */

import { formatDate } from '@angular/common';
import {
  Injectable,
  LOCALE_ID,
  Pipe,
  PipeTransform,
  inject,
} from '@angular/core';

@Pipe({ name: 'dateTime', standalone: true })
@Injectable({ providedIn: 'root' })
export class DateTimePipe implements PipeTransform {
  // Use locale set in app.config.ts
  private readonly locale = inject(LOCALE_ID);

  transform(
    value: string | undefined,
    format: 'mediumDate' | 'longDate' | 'mediumDateTime' = 'mediumDate',
  ): string | null {
    if (!value) {
      return null;
    }

    if (format === 'mediumDateTime') {
      return this.formatMediumDateTime(value);
    }

    return formatDate(value, format, this.locale);
  }

  private formatMediumDateTime(value: string): string {
    const parts = new Intl.DateTimeFormat(this.locale, {
      timeZone: 'Europe/London',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(value));
    const part = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((item) => item.type === type)?.value ?? '';

    return `${part('day')} ${part('month')} ${part('year')} at ${part('hour')}:${part('minute')}`;
  }
}
