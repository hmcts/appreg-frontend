import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DurationSectionComponent } from '../../../../../../src/app/shared/components/duration-section/duration-section.component';

describe('DurationSectionComponent', () => {
  let component: DurationSectionComponent;
  let fixture: ComponentFixture<DurationSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DurationSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DurationSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});