// pagination.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { PaginationComponent } from '../../../../../../src/app/shared/components/pagination/pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;
  let component: PaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders sequential page links when totalPages is small', () => {
    component.currentPage = 1;
    component.totalPages = 3;

    fixture.detectChanges();

    const linkEls = fixture.debugElement
      .queryAll(
        By.css(
          '.govuk-pagination__item:not(.govuk-pagination__item--ellipses) a',
        ),
      )
      .map((de) => de.nativeElement as HTMLAnchorElement);

    const texts = linkEls.map((a) => a.textContent?.trim());
    expect(texts).toEqual(['1', '2', '3']);
  });

  it('marks the current page with aria-current and current class', () => {
    component.currentPage = 2;
    component.totalPages = 5;

    fixture.detectChanges();

    const currentLinkDebug = fixture.debugElement.query(
      By.css('.govuk-pagination__item a[aria-current="page"]'),
    );
    expect(currentLinkDebug).toBeTruthy();

    const currentLink = currentLinkDebug.nativeElement as HTMLAnchorElement;
    expect(currentLink.textContent?.trim()).toBe('2');

    const li = currentLinkDebug.parent!.nativeElement as HTMLLIElement;
    expect(li.classList.contains('govuk-pagination__item--current')).toBe(true);
  });

  it('shows previous link only when currentPage > 1', () => {
    component.currentPage = 1;
    component.totalPages = 5;

    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.govuk-pagination__prev')),
    ).toBeNull();

    component.currentPage = 2;
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.govuk-pagination__prev')),
    ).not.toBeNull();
  });

  it('shows next link only when currentPage < totalPages', () => {
    component.currentPage = 5;
    component.totalPages = 5;

    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.govuk-pagination__next')),
    ).toBeNull();

    component.currentPage = 4;
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.govuk-pagination__next')),
    ).not.toBeNull();
  });

  it('calls onPageClick when a non-current page link is clicked', () => {
    component.currentPage = 1;
    component.totalPages = 3;

    const onPageClickSpy = jest.spyOn(component, 'onPageClick');

    fixture.detectChanges();

    const page2Debug = fixture.debugElement.query(
      By.css('.govuk-pagination__item a[aria-label="Page 2"]'),
    );
    expect(page2Debug).toBeTruthy();

    page2Debug.triggerEventHandler('click', new MouseEvent('click'));

    expect(onPageClickSpy).toHaveBeenCalledTimes(1);
    expect(onPageClickSpy).toHaveBeenCalledWith(2, expect.any(MouseEvent));
  });

  it('calls goTo with previous and next page indexes when prev/next are clicked', () => {
    component.currentPage = 3;
    component.totalPages = 5;

    const goToSpy = jest.spyOn(component, 'goTo');

    fixture.detectChanges();

    const prevLinkDebug = fixture.debugElement.query(
      By.css('.govuk-pagination__prev a'),
    );
    expect(prevLinkDebug).toBeTruthy();

    prevLinkDebug.triggerEventHandler('click', new MouseEvent('click'));
    expect(goToSpy).toHaveBeenCalledWith(2);

    const nextLinkDebug = fixture.debugElement.query(
      By.css('.govuk-pagination__next a'),
    );
    expect(nextLinkDebug).toBeTruthy();

    nextLinkDebug.triggerEventHandler('click', new MouseEvent('click'));
    expect(goToSpy).toHaveBeenCalledWith(4);
  });

  it('includes ellipsis items when there are many pages', () => {
    component.currentPage = 10;
    component.totalPages = 20;

    fixture.detectChanges();

    const ellipsisItems = fixture.debugElement.queryAll(
      By.css('.govuk-pagination__item--ellipses'),
    );

    expect(ellipsisItems.length).toBeGreaterThan(0);
  });
});
