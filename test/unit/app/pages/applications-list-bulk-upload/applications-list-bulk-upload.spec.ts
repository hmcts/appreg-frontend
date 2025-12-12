import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsListBulkUpload } from '../../../../../src/app/pages/applications-list-bulk-upload/applications-list-bulk-upload';

describe('ApplicationsListBulkUpload', () => {
  let component: ApplicationsListBulkUpload;
  let fixture: ComponentFixture<ApplicationsListBulkUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListBulkUpload],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListBulkUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
