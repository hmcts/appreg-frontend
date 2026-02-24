import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WordingParserComponent } from '@components/wording-parser/wording-parser.component';

describe('WordingParserComponent', () => {
  let component: WordingParserComponent;
  let fixture: ComponentFixture<WordingParserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WordingParserComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WordingParserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
