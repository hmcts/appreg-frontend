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

    return this.datePipe.transform(value, format) ?? value;
  }
}
