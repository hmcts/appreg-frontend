import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApplicationsList } from '../../../../../src/app/pages/applications-list/applications-list';

jest.mock('@ministryofjustice/frontend', () => {
  class ButtonMenu {
    constructor() {}
  }

  class SortableTable {
    constructor() {}
  }

  return { ButtonMenu, SortableTable };
});

describe('ApplicationsListComponent', () => {
  let component: ApplicationsList;
  let fixture: ComponentFixture<ApplicationsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
