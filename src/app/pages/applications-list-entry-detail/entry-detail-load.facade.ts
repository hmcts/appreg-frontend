/**
 * Facade to load data for a given entry
 */
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { savedFeeMeta } from './util/entry-load-fee-meta';

import {
  ApplicationCodeGetDetailDto,
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  StandardApplicantGetDetailDto,
  StandardApplicantsApi,
} from '@openapi';
import { CivilFeeMeta } from '@shared-types/civil-fee/civil-fee';

export type LinkedCodeLoad =
  | {
      kind: 'linkedCodeLoaded';
      code: ApplicationCodeGetDetailDto;
      feeMeta: CivilFeeMeta;
    }
  | { kind: 'linkedCodeUnavailable' };

export type SavedStandardApplicantLoad =
  | {
      kind: 'savedStandardApplicantLoaded';
      applicant: StandardApplicantGetDetailDto;
    }
  | { kind: 'savedStandardApplicantUnavailable'; error: unknown };

@Injectable()
export class EntryDetailLoadFacade {
  private readonly entriesApi = inject(ApplicationListEntriesApi);
  private readonly codesApi = inject(ApplicationCodesApi);
  private readonly standardApplicantsApi = inject(StandardApplicantsApi);

  loadEntry(
    listId: string,
    entryId: string,
  ): Observable<{ kind: 'entryLoaded'; entry: EntryGetDetailDto }> {
    return this.entriesApi
      .getApplicationListEntry({ listId, entryId }, 'body', false, {
        context: undefined,
        transferCache: true,
      })
      .pipe(map((entry) => ({ kind: 'entryLoaded' as const, entry })));
  }

  loadLinkedCode(entry: EntryGetDetailDto): Observable<LinkedCodeLoad> {
    if (
      entry.applicationCodeId === null ||
      entry.applicationCodeId === undefined
    ) {
      return of({ kind: 'linkedCodeUnavailable' });
    }

    // Get application code by ID to show include historical reference data
    return this.codesApi
      .getApplicationCodeById({ id: entry.applicationCodeId }, 'body', false, {
        transferCache: true,
      })
      .pipe(
        map((code) => ({
          kind: 'linkedCodeLoaded' as const,
          code,
          feeMeta: savedFeeMeta(entry, code),
        })),
        catchError(() => of({ kind: 'linkedCodeUnavailable' as const })),
      );
  }

  // Get by ID to include historical reference data.
  loadSavedStandardApplicant(
    id: number,
  ): Observable<SavedStandardApplicantLoad> {
    return this.standardApplicantsApi.getStandardApplicantById({ id }).pipe(
      map((applicant) => ({
        kind: 'savedStandardApplicantLoaded' as const,
        applicant,
      })),
      catchError((error: unknown) =>
        of({ kind: 'savedStandardApplicantUnavailable' as const, error }),
      ),
    );
  }
}
