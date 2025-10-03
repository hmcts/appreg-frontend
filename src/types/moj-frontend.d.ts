declare module '@ministryofjustice/frontend' {
  export class ButtonMenu {
    constructor(container: HTMLElement, config?: Record<string, unknown>);
    init(): void;
    destroy?(): void;
  }
}
