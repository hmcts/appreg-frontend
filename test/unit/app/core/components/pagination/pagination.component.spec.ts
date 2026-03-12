import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { PaginationComponent } from '@components/pagination/pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders sequential page links when totalPages is small', () => {
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 3);

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
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('totalPages', 5);

    fixture.detectChanges();

    const currentLinkDebug = fixture.debugElement.query(
      By.css('.govuk-pagination__item a[aria-current="page"]'),
    );
    expect(currentLinkDebug).toBeTruthy();

    const currentLink = currentLinkDebug.nativeElement as HTMLAnchorElement;
    expect(currentLink.textContent?.trim()).toBe('3');

    const li = currentLinkDebug.parent!.nativeElement as HTMLLIElement;
    expect(li.classList.contains('govuk-pagination__item--current')).toBe(true);
  });

  it('shows previous link only when currentPage > 0', () => {
    fixture.componentRef.setInput('currentPage', 0);
    fixture.componentRef.setInput('totalPages', 5);

    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.govuk-pagination__prev')),
    ).toBeNull();

    fixture.componentRef.setInput('currentPage', 1);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.govuk-pagination__prev')),
    ).not.toBeNull();
  });

  it('shows next link only when currentPage < totalPages', () => {
    fixture.componentRef.setInput('currentPage', 4);
    fixture.componentRef.setInput('totalPages', 5);

    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.govuk-pagination__next')),
    ).toBeNull();

    fixture.componentRef.setInput('currentPage', 2);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.govuk-pagination__next')),
    ).not.toBeNull();
  });

  it('calls onPageClick when a non-current page link is clicked', () => {
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('totalPages', 3);

    const onPageClickSpy = jest.spyOn(fixture.componentInstance, 'onPageClick');

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
    fixture.componentRef.setInput('currentPage', 5);
    fixture.componentRef.setInput('totalPages', 10);

    const goToSpy = jest.spyOn(fixture.componentInstance, 'goTo');

    fixture.detectChanges();

    const prevLinkDebug = fixture.debugElement.query(
      By.css('.govuk-pagination__prev a'),
    );
    expect(prevLinkDebug).toBeTruthy();

    prevLinkDebug.triggerEventHandler('click', new MouseEvent('click'));
    expect(goToSpy).toHaveBeenCalledWith(4);

    const nextLinkDebug = fixture.debugElement.query(
      By.css('.govuk-pagination__next a'),
    );
    expect(nextLinkDebug).toBeTruthy();

    nextLinkDebug.triggerEventHandler('click', new MouseEvent('click'));
    expect(goToSpy).toHaveBeenCalledWith(6);
  });

  it('includes ellipsis items when there are many pages', () => {
    fixture.componentRef.setInput('currentPage', 10);
    fixture.componentRef.setInput('totalPages', 20);

    fixture.detectChanges();

    const ellipsisItems = fixture.debugElement.queryAll(
      By.css('.govuk-pagination__item--ellipses'),
    );

    expect(ellipsisItems.length).toBeGreaterThan(0);
  });
});
