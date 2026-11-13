import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { of } from 'rxjs';

import { EntryDetailFeeSaveFacade } from '@components/applications-list-entry-detail/entry-detail-fee-save.facade';
import {
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  FeeStatus,
} from '@openapi';
import { ApplicationsListEntryForm } from '@shared-types/applications-list-entry-create/application-list-entry-form';

describe('EntryDetailFeeSaveFacade', () => {
  const update = jest.fn().mockReturnValue(of({}));
  let facade: EntryDetailFeeSaveFacade;

  beforeEach(() => {
    update.mockClear();
    TestBed.configureTestingModule({
      providers: [
        EntryDetailFeeSaveFacade,
        {
          provide: ApplicationListEntriesApi,
          useValue: { updateApplicationListEntry: update },
        },
      ],
    });
    facade = TestBed.inject(EntryDetailFeeSaveFacade);
  });

  it('sends a fee status partial update with the saved entry identifiers', () => {
    const entry = {
      applicationCode: 'APP-1',
      applicationCodeId: 3,
    } as EntryGetDetailDto;
    const form = {
      getRawValue: () => ({ applicationCode: 'APP-1', applicationCodeId: 3 }),
    } as ApplicationsListEntryForm;
    const statuses: FeeStatus[] = [];

    const { entryUpdateDto, response } = facade.save(
      'list-1',
      'entry-1',
      entry,
      form,
      'feeStatuses',
      statuses,
    );
    response.subscribe();

    expect(entryUpdateDto.feeStatuses).toEqual(statuses);
    expect(update).toHaveBeenCalledWith(
      { listId: 'list-1', entryId: 'entry-1', entryUpdateDto },
      'body',
      false,
      { transferCache: false },
    );
  });

  it('commits and rolls back fee baselines without emitting form changes', () => {
    const control = new FormControl<FeeStatus[] | null>([]);
    const saved = { feeStatuses: null as FeeStatus[] | null };
    const changes = jest.fn();
    control.valueChanges.subscribe(changes);
    facade.commitFeeStatuses(control, saved);
    expect(saved.feeStatuses).toEqual([]);

    facade.rollbackFeeStatuses(control, []);
    expect(changes).not.toHaveBeenCalled();
    expect(control.pristine).toBe(true);
  });

  it('uses saved offsite fee metadata before linked code metadata', () => {
    const entry = {
      fees: [
        {
          offsite: true,
          reference: 'SAVED',
          description: 'Saved fee',
          value: 12,
        },
      ],
    } as EntryGetDetailDto;
    const code = {
      offsiteFeeReference: 'CODE',
      offsiteFeeDescription: 'Code fee',
    };

    expect(facade.offsiteFeeMeta(null, entry, code, true)).toMatchObject({
      offsiteFeeReference: 'SAVED',
      offsiteFeeDescription: 'Saved fee',
      offsiteFeeAmount: { value: 1200, currency: 'GBP' },
    });
    expect(
      facade.offsiteFeeMeta(null, entry, code, false).offsiteFeeReference,
    ).toBeNull();
  });
});
