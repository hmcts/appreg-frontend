<<<<<<< HEAD
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HeaderComponent } from "../../../../../app/shared/components/header/header.component";

describe("HeaderComponent", () => {
=======
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from '../../../../../app/shared/components/header/header.component';

describe('HeaderComponent', () => {
>>>>>>> 38048e2 (Rebasing Code)
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

<<<<<<< HEAD
  it("should create", () => {
=======
  it('should create', () => {
>>>>>>> 38048e2 (Rebasing Code)
    expect(component).toBeTruthy();
  });
});
