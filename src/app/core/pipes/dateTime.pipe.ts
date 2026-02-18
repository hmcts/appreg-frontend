/**
 * Takes an ISO date string and converts to a human readable date.
 * Uses angular DatePipe default presets but we convert to en-gb
 *
 * Formats:
 *  shortDate - 28/6/26
 *  mediumDate - 28 Jun 2026
 *  longDate - 28 June 2026
 *  fullDate - Sunday, 28 June 2026
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
    format: 'mediumDate' | 'longDate' = 'mediumDate',
  ): string | null {
    if (!value) {
      return null;
    }

    return formatDate(value, format, this.locale);
  }
}
