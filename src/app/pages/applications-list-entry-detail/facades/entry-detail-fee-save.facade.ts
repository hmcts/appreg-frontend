/**
 * Facade for fee saves, rollbacks, commits, fee meta
 */
import { Injectable, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';

import { buildEntryUpdateDtoForFeeChange } from '../util/entry-detail.form';

import {
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
  FeeStatus,
} from '@openapi';
import { ApplicationsListEntryForm } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import { CivilFeeMeta } from '@shared-types/civil-fee/civil-fee';

@Injectable()
export class EntryDetailFeeSaveFacade {
  private readonly entriesApi = inject(ApplicationListEntriesApi);

  save<K extends 'feeStatuses' | 'hasOffsiteFee'>(
    listId: string,
    entryId: string,
    entry: EntryGetDetailDto,
    form: ApplicationsListEntryForm,
    key: K,
    value: EntryUpdateDto[K],
  ): {
    entryUpdateDto: EntryUpdateDto;
    response: Observable<EntryGetDetailDto>;
  } {
    const entryUpdateDto = buildEntryUpdateDtoForFeeChange(
      entry,
      form.getRawValue(),
      key,
      value,
    );
    return {
      entryUpdateDto,
      response: this.entriesApi.updateApplicationListEntry(
        { listId, entryId, entryUpdateDto },
        'body',
        false,
        { transferCache: false },
      ),
    };
  }

  rollbackFeeStatuses(
    control: FormControl<FeeStatus[] | null>,
    previous: FeeStatus[],
  ): void {
    control.setValue(previous, { emitEvent: false });
    control.markAsPristine();
  }

  rollbackOffsiteFee(
    control: FormControl<boolean | null>,
    previous: boolean,
  ): void {
    control.setValue(previous, { emitEvent: false });
    control.markAsPristine();
  }

  offsiteFeeMeta(
    current: CivilFeeMeta | null,
    entry: EntryGetDetailDto | null,
    code: {
      offsiteFeeReference?: string | null;
      offsiteFeeDescription?: string | null;
      offsiteFeeAmount?: CivilFeeMeta['offsiteFeeAmount'];
    } | null,
    enabled: boolean,
  ): CivilFeeMeta {
    const fee = entry?.fees?.find((item) => item.offsite === true);
    return {
      ...current,
      offsiteFeeReference: enabled
        ? (fee?.reference ?? code?.offsiteFeeReference ?? null)
        : null,
      offsiteFeeDescription: enabled
        ? (fee?.description ?? code?.offsiteFeeDescription ?? null)
        : null,
      offsiteFeeAmount: enabled
        ? typeof fee?.value === 'number'
          ? { value: fee.value * 100, currency: 'GBP' }
          : (code?.offsiteFeeAmount ?? null)
        : null,
    };
  }
}
