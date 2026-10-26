import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SummaryListCardActionComponent } from '@components/summary-list-card-action/summary-list-card-action.component';
import { SummaryListCardAction } from '@core-types/summary-list-card-action/summary-list-card.type';

const makeSummaryList = (
  overrides?: Partial<SummaryListCardAction>,
): SummaryListCardAction => ({
  id: 'row-1',
  title: 'Test row',
  status: 'existing',
  content: [{ key: 'Wording', value: 'Default wording' }],
  ...overrides,
});

@Component({
  standalone: true,
  imports: [CommonModule, SummaryListCardActionComponent],
  template: `
    <ng-template #cardBody let-card>
      <span class="custom-card-body">{{ card.title }} custom body</span>
    </ng-template>

    <app-summary-list-card-action
      [summaryLists]="summaryLists"
      [cardBodyTemplate]="cardBody"
      (cardClick)="lastClicked = $event"
    />
  `,
})
class HostWithCardBodyTemplateComponent {
  summaryLists: SummaryListCardAction[] = [
    makeSummaryList({ showValue: false }),
  ];
  lastClicked: SummaryListCardAction | null = null;
}

@Component({
  imports: [SummaryListCardActionComponent],
  template: `
    <ng-template #actions let-card>
      <li class="govuk-summary-card__action">
        <a href="#change" (click)="$event.preventDefault(); selected = card.id"
          >Change<span class="govuk-visually-hidden"> {{ card.title }}</span></a
        >
      </li>
      <li class="govuk-summary-card__action">
        <a href="#remove" (click)="$event.preventDefault(); removed = card.id"
          >Remove<span class="govuk-visually-hidden"> {{ card.title }}</span></a
        >
      </li>
    </ng-template>
    <app-summary-list-card-action
      [summaryLists]="cards"
      [cardActionsTemplate]="actions"
    />
  `,
})
class HostWithHeaderActions {
  cards = [
    makeSummaryList({
      content: [
        { key: 'Name', value: 'Example organisation' },
        { key: 'Address', value: 'Example address' },
      ],
    }),
  ];
  selected: string | null = null;
  removed: string | null = null;
}

describe('SummaryListCardActionComponent', () => {
  it('supports multiple header actions and groups the card rows into a single summary list', async () => {
    await TestBed.configureTestingModule({
      imports: [HostWithHeaderActions],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostWithHeaderActions);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const links = element.querySelectorAll<HTMLAnchorElement>(
      '.govuk-summary-card__title-wrapper a',
    );
    expect(links).toHaveLength(2);
    expect(links[0].textContent).toContain('Change');
    expect(links[0].textContent).toContain('Test row');
    links[0].click();
    links[1].click();
    expect(fixture.componentInstance.selected).toBe('row-1');
    expect(fixture.componentInstance.removed).toBe('row-1');
    expect(
      element.querySelectorAll('.govuk-summary-card__content dl'),
    ).toHaveLength(1);
    expect(element.querySelectorAll('.govuk-summary-list__row')).toHaveLength(
      2,
    );
  });

  describe('component behavior', () => {
    let component: SummaryListCardActionComponent;
    let fixture: ComponentFixture<SummaryListCardActionComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SummaryListCardActionComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(SummaryListCardActionComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('summaryLists', [makeSummaryList()]);
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('renders title, key/value content, and default action text', () => {
      const host = fixture.nativeElement;

      expect(host.textContent).toContain('Test row');
      expect(host.textContent).toContain('Wording');
      expect(host.textContent).toContain('Default wording');
      expect(host.textContent).toContain('Remove');
    });

    it('renders an optional footer', () => {
      fixture.componentRef.setInput('summaryLists', [
        makeSummaryList({ footer: 'Updated on 28 Aug 2026 at 10:15' }),
      ]);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'Updated on 28 Aug 2026 at 10:15',
      );
    });

    it('applies compact class by default', () => {
      const container = fixture.nativeElement.querySelector(
        '.summary-card-action',
      );

      expect(container.classList.contains('summary-card-action--compact')).toBe(
        true,
      );
    });

    it('supports custom action text and non-compact mode', () => {
      fixture.componentRef.setInput('actionText', 'Delete');
      fixture.componentRef.setInput('compact', false);
      fixture.detectChanges();

      const host = fixture.nativeElement;
      const container = host.querySelector('.summary-card-action');

      expect(host.textContent).toContain('Delete');
      expect(container.classList.contains('summary-card-action--compact')).toBe(
        false,
      );
    });

    it('emits clicked action when action link is clicked', () => {
      const clickSpy = jest.spyOn(component.cardClick, 'emit');
      const link = fixture.debugElement.query(
        By.css('.govuk-summary-card__action a'),
      );

      link.nativeElement.click();

      expect(clickSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'row-1', title: 'Test row' }),
      );
    });

    it('getStatusTag returns pending, existing, and null states', () => {
      expect(component.getStatusTag('pending')).toEqual({
        text: 'Pending',
        className: 'govuk-tag--grey',
      });
      expect(component.getStatusTag('existing')).toEqual({ text: 'Existing' });
      expect(component.getStatusTag(undefined)).toBeNull();
    });

    it('renders pending tag class when status is pending', () => {
      fixture.componentRef.setInput('summaryLists', [
        makeSummaryList({ status: 'pending' }),
      ]);
      fixture.detectChanges();

      const tag = fixture.debugElement.query(By.css('.govuk-tag'));
      expect(tag.nativeElement.textContent).toContain('Pending');
      expect(tag.nativeElement.className).toContain('govuk-tag--grey');
    });
  });

  describe('cardBodyTemplate rendering', () => {
    let fixture: ComponentFixture<HostWithCardBodyTemplateComponent>;
    let hostComponent: HostWithCardBodyTemplateComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostWithCardBodyTemplateComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(HostWithCardBodyTemplateComponent);
      hostComponent = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('renders custom card body with list context when cardBodyTemplate is provided', () => {
      const host = fixture.nativeElement;

      expect(host.textContent).toContain('Test row custom body');
      expect(host.querySelector('.custom-card-body')).toBeTruthy();
    });

    it('suppresses default entry value when cardBodyTemplate is provided', () => {
      const host = fixture.nativeElement;

      expect(host.textContent).not.toContain('Default wording');
    });

    it('still emits cardClick from wrapped component', () => {
      const link = fixture.debugElement.query(
        By.css('.govuk-summary-card__action a'),
      );

      link.nativeElement.click();

      expect(hostComponent.lastClicked).toEqual(
        expect.objectContaining({ id: 'row-1', title: 'Test row' }),
      );
    });
  });
});
