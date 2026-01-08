import { Component, effect, input, output } from '@angular/core';

import { ApplicantContext } from '@components/applications-list/util/routing-state-util';
import {
  EXISTING_RESULTS_WORDING_COLUMNS,
  RESULT_WORDING_COLUMNS,
} from '@components/applications-list-entry-detail/util/entry-detail.constants';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { ResultCodeGetSummaryDto, ResultGetDto } from '@openapi';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { makeTempId } from '@util/data-utils';
import { ResultRow, toExistingRows } from '@util/result-code-helpers';

@Component({
  selector: 'app-result-wording-section',
  templateUrl: './result-wording-section.component.html',
  imports: [SortableTableComponent, SuggestionsComponent],
})
export class ResultWordingSectionComponent {
  resultApplicantContext = input<ApplicantContext[]>([]);
  resultCodesList = input<ResultCodeGetSummaryDto[]>([]);
  existingResults = input<ResultGetDto[]>([]);
  wordingByCode = input<Record<string, string>>({});

  removeExisting = output<string>();
  pendingChange = output<PendingResultRow[]>();

  applyPending = output<PendingResultRow>();
  clearPendingToken = input<number>(0);

  private pending: PendingResultRow[] = [];

  applicantRespondentColumns: TableColumn[] = RESULT_WORDING_COLUMNS;
  existingResultsColumns: TableColumn[] = EXISTING_RESULTS_WORDING_COLUMNS;
  resultCodeLabel = (rc: ResultCodeGetSummaryDto): string =>
    `${rc.resultCode} - ${rc.title}`;

  resultCodeSearch = '';

  constructor() {
    effect(() => {
      const token = this.clearPendingToken(); // reading the input signal tracks it
      if (token === 0) {
        return;
      }

      this.pending = [];
      this.pendingChange.emit(this.pending);
      this.resultCodeSearch = '';
    });
  }

  get filteredResultCodes(): ResultCodeGetSummaryDto[] {
    if (this.pending.length > 0) {
      return [];
    }

    const q = this.norm(this.resultCodeSearch);
    if (!q) {
      return [];
    }

    return this.resultCodesList()
      .filter((rc) => this.norm(`${rc.resultCode} ${rc.title}`).includes(q))
      .slice(0, 50);
  }

  get tableRows(): ResultRow[] {
    const codes = this.resultCodesList();
    const existing = toExistingRows(this.existingResults() ?? [], codes);

    const map = this.wordingByCode();

    const withWording = (row: ResultRow): ResultRow => {
      const key = this.normCode(row.resultCode);
      return {
        ...row,
        wording: map[key] ?? row.wording ?? '-',
      };
    };

    return [...this.pending.map(withWording), ...existing.map(withWording)];
  }

  selectResultCode(item: ResultCodeGetSummaryDto): void {
    const code = item.resultCode.trim();
    if (!code) {
      return;
    }

    const exists =
      this.pending.some((p) => p.resultCode === code) ||
      (this.existingResults() ?? []).some((e) => e.resultCode === code);

    if (exists) {
      this.resultCodeSearch = '';
      return;
    }

    const row: PendingResultRow = {
      kind: 'pending',
      tempId: makeTempId(),
      resultCode: code,
      display: `${item.resultCode} - ${item.title}`,
      wordingFields: [],
      wording: '-',
    };

    //Only allow one result to be added at a time
    this.pending = [row];
    this.pendingChange.emit(this.pending);
    this.resultCodeSearch = '';
  }

  get canApply(): boolean {
    return this.pending.length > 0;
  }

  onSaveResult(): void {
    const row = this.pending[0];
    if (!row) {
      return;
    }

    this.applyPending.emit(row);
  }

  onRemoveClicked(row: Record<string, unknown>): void {
    const kind = row['kind'];

    if (kind === 'pending') {
      const tempId = row['tempId'];
      if (typeof tempId === 'string') {
        this.removePending(tempId);
      }
      return;
    }

    if (kind === 'existing') {
      const id = row['id'];
      if (typeof id === 'string') {
        this.removeExisting.emit(id);
      }
    }
  }

  private removePending(tempId: string): void {
    this.pending = this.pending.filter((p) => p.tempId !== tempId);
    this.pendingChange.emit(this.pending);
  }

  private norm(s: string): string {
    return s
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private normCode(code: string): string {
    return (code ?? '').trim().toUpperCase();
  }
}
