declare module '@ministryofjustice/frontend' {
  export class DatePicker {
    constructor(container: HTMLElement, config?: Record<string, unknown>);
    config: { minDate: string; maxDate: string };
    closeDialog(): void;
    setMinAndMaxDatesOnCalendar(): void;
  }

  export class ButtonMenu {
    constructor(container: HTMLElement, config?: Record<string, unknown>);
    init(): void;
    destroy?(): void;
  }
}
