import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CivilFeeSectionComponent } from '../../../../../../src/app/shared/components/civil-fee-section/civil-fee-section.component';

describe('CivilFeeSectionComponent', () => {
  let component: CivilFeeSectionComponent;
  let fixture: ComponentFixture<CivilFeeSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CivilFeeSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CivilFeeSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
