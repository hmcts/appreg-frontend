import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficialsSectionComponent } from '@components/officials-section/officials-section.component';

describe('OfficialsSectionComponent', () => {
  let component: OfficialsSectionComponent;
  let fixture: ComponentFixture<OfficialsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficialsSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OfficialsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
