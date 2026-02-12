import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateTime',
  standalone: true,
})
export class DateTimePipe implements PipeTransform {
  // Angular defaults to en-US so set to en-GB
  private readonly datePipe = new DatePipe('en-GB');

  transform(
    value: string | undefined,
    format: 'shortDate' | 'mediumDate' | 'longDate' | 'fullDate' = 'mediumDate', // Angular presets
  ): string | null {
    if (!value) {
      return null;
    }

    // expects "YYYY-MM-DD"
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return value;
    }

    const monthNum = Number.parseInt(match[2], 10);

    // Return original string if date is out of range
    if (monthNum < 1 || monthNum > 12) {
      return value;
    }

    return this.datePipe.transform(value, format) ?? value;
  }
}
