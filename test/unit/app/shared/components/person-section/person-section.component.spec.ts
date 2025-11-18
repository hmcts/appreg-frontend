import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonSectionComponent } from '../../../../../../src/app/shared/components/person-section/person-section.component';

describe('PersonSectionComponent', () => {
  let component: PersonSectionComponent;
  let fixture: ComponentFixture<PersonSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});