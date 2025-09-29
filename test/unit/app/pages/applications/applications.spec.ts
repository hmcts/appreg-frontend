import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Applications } from '../../../../../src/app/pages/applications/applications';

describe('ApplicationsComponent', () => {
  let component: Applications;
  let fixture: ComponentFixture<Applications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Applications],
    }).compileComponents();

    fixture = TestBed.createComponent(Applications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
