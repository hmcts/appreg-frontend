import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesSectionComponent } from '../../../../../../src/app/shared/components/notes-section/notes-section.component';

describe('NotesSectionComponent', () => {
  let component: NotesSectionComponent;
  let fixture: ComponentFixture<NotesSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotesSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
