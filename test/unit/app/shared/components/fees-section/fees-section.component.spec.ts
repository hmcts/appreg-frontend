import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeesSectionComponent } from '../../../../../../src/app/shared/components/fees-section/fees-section.component';

describe('FeesSectionComponent', () => {
  let component: FeesSectionComponent;
  let fixture: ComponentFixture<FeesSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeesSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});