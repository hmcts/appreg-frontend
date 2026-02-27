import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

import { RESULT_WORDING_COLUMNS } from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { ApplicantContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import {
  SummaryListCardAction,
  SummaryListCardActionComponent,
} from '@components/summary-list-card-action/summary-list-card-action.component';
import { ResultCodeGetSummaryDto, ResultGetDto } from '@openapi';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import { makeTempId } from '@util/data-utils';
import { ResultRow, toExistingRows } from '@util/result-code-helpers';

@Component({
  selector: 'app-result-wording-section',
  templateUrl: './result-wording-section.component.html',
  imports: [
    SortableTableComponent,
    SuggestionsComponent,
    SummaryListCardActionComponent,
  ],
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

  private readonly pending = signal<PendingResultRow[]>([]);
  private readonly pendingVersion = signal(0);
  private readonly appliedVersion = signal(0);

  applicantRespondentColumns: TableColumn[] = RESULT_WORDING_COLUMNS;

  resultCodeLabel = (rc: ResultCodeGetSummaryDto): string =>
    `${rc.resultCode} - ${rc.title}`;

  resultCodeSearch = '';

  constructor() {
    effect(() => {
      const token = this.clearPendingToken(); // reading the input signal tracks it
      if (token === 0) {
        return;
      }

      if (this.pendingVersion() === this.appliedVersion()) {
        this.pending.set([]);
        this.pendingChange.emit(this.pending());
        this.resultCodeSearch = '';
      }
    });
  }

  get filteredResultCodes(): ResultCodeGetSummaryDto[] {
    if (this.pending().length > 0) {
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

  readonly tableRows = computed<ResultRow[]>(() => {
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

    return [...this.pending().map(withWording), ...existing.map(withWording)];
  });

  readonly existingResultSummaryLists = computed<SummaryListCardAction[]>(() =>
    this.tableRows().map((row) => ({
      id: row.kind === 'pending' ? row.tempId : row.id,
      title: row.display,
      status: row.kind === 'pending' ? 'pending' : 'existing',
      content: [
        {
          key: 'Wording',
          value: row.wording ?? '-',
        },
      ],
    })),
  );

  selectResultCode(item: ResultCodeGetSummaryDto): void {
    const code = item.resultCode.trim();
    if (!code) {
      return;
    }

    const exists =
      this.pending().some((p) => p.resultCode === code) ||
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
    this.pending.set([row]);
    this.pendingVersion.update((n) => n + 1);
    this.pendingChange.emit(this.pending());
    this.resultCodeSearch = '';
  }

  get canApply(): boolean {
    return this.pending().length > 0;
  }

  onSaveResult(): void {
    const row = this.pending()[0];
    if (!row) {
      return;
    }

    this.applyPending.emit(row);
    this.appliedVersion.set(this.pendingVersion());
    this.pending.set([]);
    this.pendingChange.emit(this.pending());
    this.resultCodeSearch = '';
  }

  onRemoveClicked(row: ResultRow): void {
    if (row.kind === 'pending') {
      this.removePending(row.tempId);
      return;
    }

    this.removeExisting.emit(row.id);
  }

  onSummaryActionClick(action: SummaryListCardAction): void {
    const id = action.id;
    if (!id) {
      return;
    }

    const row = this.tableRows().find((r) => {
      const rowId = r.kind === 'pending' ? r.tempId : r.id;
      return rowId === id;
    });

    if (row) {
      this.onRemoveClicked(row);
    }
  }

  private removePending(tempId: string): void {
    this.pending.set(this.pending().filter((p) => p.tempId !== tempId));
    this.pendingChange.emit(this.pending());
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
