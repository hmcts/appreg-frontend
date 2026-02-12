import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateTime',
  standalone: true,
})
export class DateTimePipe implements PipeTransform {
  transform(
    value: string | undefined,
    monthFormat: 'short' | 'long' = 'short',
  ): string | null {
    if (!value) {
      return null;
    }

    // expects "YYYY-MM-DD"
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return value;
    }

    const [, year, monthRaw, day] = match;
    const monthNum = Number.parseInt(monthRaw, 10);

    const monthNamesLong = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const monthNamesShort = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const monthNames =
      monthFormat === 'long' ? monthNamesLong : monthNamesShort;
    const monthName = monthNames[monthNum - 1];
    if (!monthName) {
      return value;
    }

    return `${day} ${monthName} ${year}`;
  }
}
