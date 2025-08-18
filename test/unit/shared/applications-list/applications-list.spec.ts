import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsList } from '../../../../src/app/pages/applications-list/applications-list';

describe('ApplicationsListComponent', () => {
  let component: ApplicationsList;
  let fixture: ComponentFixture<ApplicationsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsList],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
