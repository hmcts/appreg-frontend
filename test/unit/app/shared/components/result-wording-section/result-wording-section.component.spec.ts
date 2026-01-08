import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultWordingSectionComponent } from '../../../../../../src/app/shared/components/result-wording-section/result-wording-section.component';

describe('ResultWordingSectionComponent', () => {
  let component: ResultWordingSectionComponent;
  let fixture: ComponentFixture<ResultWordingSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultWordingSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultWordingSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
