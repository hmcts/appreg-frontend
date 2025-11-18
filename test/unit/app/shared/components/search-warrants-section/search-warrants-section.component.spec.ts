import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchWarrantsSectionComponent } from '../../../../../../src/app/shared/components/search-warrants-section/search-warrants-section.component';

describe('SearchWarrantsSectionComponent', () => {
  let component: SearchWarrantsSectionComponent;
  let fixture: ComponentFixture<SearchWarrantsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchWarrantsSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchWarrantsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});