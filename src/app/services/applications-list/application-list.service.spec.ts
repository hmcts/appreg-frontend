import { TestBed } from '@angular/core/testing';

import { ApplicationListService } from './application-list.service';

describe('ApplicationListService', () => {
  let service: ApplicationListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
