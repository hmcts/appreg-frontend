import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ApplicationsList } from '../../../../../src/app/pages/applications-list/applications-list';
import { ApplicationListsApi } from '../../../../../src/generated/openapi';

jest.mock('@ministryofjustice/frontend', () => {
  class ButtonMenu {
    constructor() {}

    init() {}
  }

  return { ButtonMenu };
});

describe('ApplicationsListComponent', () => {
  let fixture: ComponentFixture<ApplicationsList>;
  let component: ApplicationsList;

  beforeEach(async () => {
    const appListsApiStub = {
      deleteApplicationList: jest.fn().mockReturnValue(of({ status: 204 })),
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationsList],
      providers: [
        provideRouter([]),
        { provide: ApplicationListsApi, useValue: appListsApiStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
