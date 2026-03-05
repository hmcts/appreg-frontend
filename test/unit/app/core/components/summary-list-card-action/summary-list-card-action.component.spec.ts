import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  SummaryListCardAction,
  SummaryListCardActionComponent,
} from '@components/summary-list-card-action/summary-list-card-action.component';

const makeSummaryList = (
  overrides?: Partial<SummaryListCardAction>,
): SummaryListCardAction => ({
  id: 'row-1',
  title: 'Test row',
  status: 'existing',
  content: [{ key: 'Wording', value: 'Default wording' }],
  ...(overrides ?? {}),
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
      (onClick)="lastClicked = $event"
    />
  `,
})
class HostWithCardBodyTemplateComponent {
  summaryLists: SummaryListCardAction[] = [
    makeSummaryList({ showValue: false }),
  ];
  lastClicked: SummaryListCardAction | null = null;
}

describe('SummaryListCardActionComponent', () => {
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
      const host = fixture.nativeElement as HTMLElement;

      expect(host.textContent).toContain('Test row');
      expect(host.textContent).toContain('Wording');
      expect(host.textContent).toContain('Default wording');
      expect(host.textContent).toContain('Remove');
    });

    it('applies compact class by default', () => {
      const container = fixture.nativeElement.querySelector(
        '.summary-card-action',
      ) as HTMLElement;

      expect(container.classList.contains('summary-card-action--compact')).toBe(
        true,
      );
    });

    it('supports custom action text and non-compact mode', () => {
      fixture.componentRef.setInput('actionText', 'Delete');
      fixture.componentRef.setInput('compact', false);
      fixture.detectChanges();

      const host = fixture.nativeElement as HTMLElement;
      const container = host.querySelector(
        '.summary-card-action',
      ) as HTMLElement;

      expect(host.textContent).toContain('Delete');
      expect(container.classList.contains('summary-card-action--compact')).toBe(
        false,
      );
    });

    it('emits clicked action when action link is clicked', () => {
      const clickSpy = jest.spyOn(component.onClick, 'emit');
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
      const host = fixture.nativeElement as HTMLElement;

      expect(host.textContent).toContain('Test row custom body');
      expect(host.querySelector('.custom-card-body')).toBeTruthy();
    });

    it('suppresses default entry value when cardBodyTemplate is provided', () => {
      const host = fixture.nativeElement as HTMLElement;

      expect(host.textContent).not.toContain('Default wording');
    });

    it('still emits onClick from wrapped component', () => {
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
