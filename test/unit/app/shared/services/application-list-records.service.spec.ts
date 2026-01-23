import { TestBed } from '@angular/core/testing';

import { ApplicationListRecordsService } from '@services/application-list-records/application-list-records.service';

describe('ApplicationListRecordsService', () => {
  let service: ApplicationListRecordsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationListRecordsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
