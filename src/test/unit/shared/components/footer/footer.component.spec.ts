<<<<<<< HEAD
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FooterComponent } from "../../../../../app/shared/components/footer/footer.component";

describe("FooterComponent", () => {
=======
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterComponent } from '../../../../../app/shared/components/footer/footer.component';

describe('FooterComponent', () => {
>>>>>>> 38048e2 (Rebasing Code)
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
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
