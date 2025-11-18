import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganisationSectionComponent } from '../../../../../../src/app/shared/components/organisation-section/organisation-section.component';

describe('OrganisationSectionComponent', () => {
  let component: OrganisationSectionComponent;
  let fixture: ComponentFixture<OrganisationSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganisationSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganisationSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});