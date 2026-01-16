import { TestBed } from '@angular/core/testing';

import {
  ApplicationListSearchFormService,
  DEFAULT_STATE,
  SearchFormValue,
} from '@services/searchform/application-list-search-form.service';

describe('ApplicationListSearchFormService', () => {
  let service: ApplicationListSearchFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationListSearchFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialise with DEFAULT_STATE', () => {
    expect(service.state()).toEqual(DEFAULT_STATE);
  });

  it('setState should replace the entire state', () => {
    const next: SearchFormValue = {
      date: '2026-01-14',
      time: null,
      description: 'Some description',
      status: 'open',
      court: 'Court A',
      location: 'London',
      cja: 'CJA-123',
    };

    service.setState(next);

    expect(service.state()).toEqual(next);
  });

  it('patchState should merge partial values over current state', () => {
    // start from known state
    service.reset();

    service.patchState({
      court: 'Court B',
      location: 'Manchester',
    });

    expect(service.state()).toEqual({
      ...DEFAULT_STATE,
      court: 'Court B',
      location: 'Manchester',
    });
  });

  it('patchState should not clear other fields when patching', () => {
    const initial: SearchFormValue = {
      date: '2026-01-01',
      time: null,
      description: 'Init',
      status: 'closed',
      court: 'Court X',
      location: 'Birmingham',
      cja: 'CJA-999',
    };
    service.setState(initial);

    service.patchState({ description: 'Updated' });

    expect(service.state()).toEqual({
      ...initial,
      description: 'Updated',
    });
  });

  it('reset should restore DEFAULT_STATE (and not keep references to a previous object)', () => {
    service.setState({
      date: '2026-01-14',
      time: null,
      description: 'Changed',
      status: 'open',
      court: 'Court A',
      location: 'London',
      cja: 'CJA-123',
    });

    service.reset();

    expect(service.state()).toEqual(DEFAULT_STATE);
  });
});
