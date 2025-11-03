import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsListEntryCreate } from '../../../../../src/app/pages/applications-list-entry-create/applications-list-entry-create';

describe('ApplicationsListEntryCreate', () => {
  let component: ApplicationsListEntryCreate;
  let fixture: ComponentFixture<ApplicationsListEntryCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListEntryCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicationsListEntryCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
