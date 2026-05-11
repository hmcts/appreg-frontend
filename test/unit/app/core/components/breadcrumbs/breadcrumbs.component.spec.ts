import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';

describe('BreadcrumbsComponent', () => {
  let component: BreadcrumbsComponent;
  let fixture: ComponentFixture<BreadcrumbsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('items', [
      { label: 'Home', link: '/' },
      { label: 'Section', link: '/section' },
      { label: 'Current page', link: '/section/current' },
    ]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the nav with the correct aria-label', () => {
    const nav = fixture.debugElement.query(By.css('nav.govuk-breadcrumbs'));
    expect(nav).toBeTruthy();
    expect(nav.attributes['aria-label']).toBe('Breadcrumb');
  });

  it('renders a list item for each breadcrumb item', () => {
    const items = fixture.debugElement.queryAll(
      By.css('li.govuk-breadcrumbs__list-item'),
    );
    expect(items).toHaveLength(3);

    const labels = items.map((de) =>
      (de.nativeElement as HTMLElement)
        .querySelector('.govuk-breadcrumbs__link')
        ?.textContent?.trim(),
    );

    expect(labels).toEqual(['Home', 'Section', 'Current page']);
  });

  it('renders a link for each breadcrumb item', () => {
    const links = fixture.debugElement.queryAll(
      By.css('a.govuk-breadcrumbs__link'),
    );
    expect(links).toHaveLength(3);
  });

  it('renders no list items when items is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(
      By.css('li.govuk-breadcrumbs__list-item'),
    );
    expect(items).toHaveLength(0);
  });
});
