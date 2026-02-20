import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WordingSectionComponent } from './wording-section.component';

describe('WordingSectionComponent', () => {
  let component: WordingSectionComponent;
  let fixture: ComponentFixture<WordingSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordingSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WordingSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
