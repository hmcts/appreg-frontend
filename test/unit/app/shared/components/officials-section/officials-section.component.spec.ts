import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { OfficialsSectionComponent } from '@components/officials-section/officials-section.component';

describe('OfficialsSectionComponent', () => {
  let component: OfficialsSectionComponent;
  let fixture: ComponentFixture<OfficialsSectionComponent>;

  const createGroup = (): FormGroup =>
    new FormGroup({
      mags1Title: new FormControl<string | null>(null),
      mags1FirstName: new FormControl<string | null>(null),
      mags1Surname: new FormControl<string | null>(null),
      mags2Title: new FormControl<string | null>(null),
      mags2FirstName: new FormControl<string | null>(null),
      mags2Surname: new FormControl<string | null>(null),
      mags3Title: new FormControl<string | null>(null),
      mags3FirstName: new FormControl<string | null>(null),
      mags3Surname: new FormControl<string | null>(null),
      officialTitle: new FormControl<string | null>(null),
      officialFirstName: new FormControl<string | null>(null),
      officialSurname: new FormControl<string | null>(null),
    });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficialsSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OfficialsSectionComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('group', createGroup());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose title options', () => {
    expect(component.titleOptions).toBeTruthy();
    expect(Array.isArray(component.titleOptions)).toBe(true);
  });

  it('should emit saveOfficialsClicked when onSaveOfficials is called', () => {
    const emitSpy = jest.spyOn(component.saveOfficialsClicked, 'emit');

    component.onSaveOfficials();

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('should accept the provided group input', () => {
    const group = createGroup();

    fixture.componentRef.setInput('group', group);
    fixture.detectChanges();

    expect(component.group()).toBe(group);
  });
});
