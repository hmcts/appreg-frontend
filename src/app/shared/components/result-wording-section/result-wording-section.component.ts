/*
  Result wording section orchestration:
  - Displays existing and pending result cards, rendering wording-parser inputs for templated wording.
  - Tracks pending result selection plus in-progress edits for existing result wording fields.
  - Coordinates submit-time validation across all parser instances and emits a single payload containing:
      1) pending results to create, and
      2) existing results whose wording fields changed (for update).
  - Emits section-level wording errors for parent error summary and guards existing-row removal when errors are unresolved.
*/

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
import { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { SummaryListCardActionComponent } from '@components/summary-list-card-action/summary-list-card-action.component';
import { WordingParserComponent } from '@components/wording-parser/wording-parser.component';
import { SummaryListCardAction } from '@core-types/summary-list-card-action/summary-list-card.type';
import {
  ResultCodeGetSummaryDto,
  ResultGetDto,
  TemplateDetail,
  TemplateSubstitution,
} from '@openapi';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';
import {
  ResultSectionSubmitPayload,
  UpdateExistingResultWordingPayload,
} from '@shared-types/result-wording-section/result-section.types';
import { makeTempId } from '@util/data-utils';
import { ResultRow, toExistingRows } from '@util/result-code-helpers';

@Component({
  selector: 'app-result-wording-section',
  templateUrl: './result-wording-section.component.html',
  imports: [
    SortableTableComponent,
    SuggestionsComponent,
    SummaryListCardActionComponent,
    WordingParserComponent,
  ],
})
export class ResultWordingSectionComponent {
  resultApplicantContext = input<ApplicantContext[]>([]);
  resultCodesList = input<ResultCodeGetSummaryDto[]>([]);
  existingResults = input<ResultGetDto[]>([]);
  wordingByCode = input<Record<string, string>>({});
  resultCodeTemplateByCode = input<Record<string, TemplateDetail>>({});
  clearPendingToken = input<number>(0);

  removeExisting = output<string>();
  pendingChange = output<PendingResultRow[]>();
  submitResults = output<ResultSectionSubmitPayload>();

  wordingFieldErrors = output<ErrorItem[]>();

  private readonly pending = signal<PendingResultRow[]>([]);
  private readonly pendingVersion = signal(0);
  private readonly appliedVersion = signal(0);
  readonly wordingSubmitAttempt = signal(0);
  private readonly currentWordingErrors = signal<ErrorItem[]>([]);
  private readonly existingWordingDraftById = signal<
    Record<string, TemplateSubstitution[]>
  >({});

  private submitValidationRequested = false;
  private validationTargetCardIds = new Set<string>();
  private readonly validationResolvedCardIds = new Set<string>();
  private readonly validationErrorsByCard = new Map<string, ErrorItem[]>();

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
    const map = this.wordingByCode();

    const withWording = (row: ResultRow): ResultRow => {
      const key = this.normCode(row.resultCode);
      return {
        ...row,
        wording: map[key] ?? row.wording ?? '-',
      };
    };

    return [
      ...this.pending().map(withWording),
      ...this.existingRows().map(withWording),
    ];
  });

  readonly existingRows = computed(() =>
    toExistingRows(this.existingResults() ?? [], this.resultCodesList()),
  );

  readonly existingResultSummaryLists = computed<SummaryListCardAction[]>(() =>
    this.tableRows().map((row) => {
      const template = this.getTemplateForRow(row);
      const shouldRenderParser = this.shouldRenderParserForRow(row);

      return {
        id: row.kind === 'pending' ? row.tempId : row.id,
        title: row.display,
        status: row.kind === 'pending' ? 'pending' : 'existing',
        showValue: !shouldRenderParser,
        content: [
          {
            key: 'Wording',
            value: template?.template || row.wording || '-',
          },
        ],
      };
    }),
  );

  readonly existingTemplateById = computed<Record<string, TemplateDetail>>(() =>
    (this.existingResults() ?? []).reduce<Record<string, TemplateDetail>>(
      (acc, result) => {
        const template = this.readTemplateFromExistingResult(result);
        if (!template) {
          return acc;
        }

        acc[result.id] = template;
        return acc;
      },
      {},
    ),
  );

  readonly existingOriginalFieldsById = computed<
    Record<string, TemplateSubstitution[]>
  >(() =>
    this.existingRows().reduce<Record<string, TemplateSubstitution[]>>(
      (acc, row) => {
        acc[row.id] = row.wordingFields ?? [];
        return acc;
      },
      {},
    ),
  );

  readonly hasExistingEdits = computed(() => {
    const draftById = this.existingWordingDraftById();
    const originalById = this.existingOriginalFieldsById();

    return this.existingRows()
      .filter((row) => this.shouldRenderParserForRow(row))
      .some((row) => {
        const originalFields = originalById[row.id] ?? [];
        const nextFields = draftById[row.id] ?? originalFields;

        return !this.areWordingFieldsEqual(originalFields, nextFields);
      });
  });

  readonly canSubmitResults = computed(
    () => this.pending().length > 0 || this.hasExistingEdits(),
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

  onSaveResult(): void {
    const parserCardIds = this.getParserCardIdsForSubmit();

    this.submitValidationRequested = true;
    this.validationTargetCardIds = new Set(parserCardIds);
    this.validationResolvedCardIds.clear();
    this.validationErrorsByCard.clear();

    if (parserCardIds.length === 0) {
      this.completeSubmitAttempt();
      return;
    }

    // Ask all parser instances (pending + existing) to validate/emit latest values
    this.wordingSubmitAttempt.update((n) => n + 1);
  }

  onRemoveClicked(row: ResultRow): void {
    if (row.kind === 'pending') {
      this.removePending(row.tempId);
      return;
    }

    this.removeExisting.emit(row.id);
  }

  onSummaryActionClick(action: SummaryListCardAction): void {
    const currentErrors = this.currentWordingErrors();
    if (action.status === 'existing' && currentErrors.length > 0) {
      this.emitWordingErrors([
        ...currentErrors,
        {
          text: 'Resolve result wording errors before removing an existing result.',
          href: '#result-code',
        },
      ]);
      return;
    }

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

  getTemplateForCard(card: SummaryListCardAction): TemplateDetail | null {
    if (!card.id) {
      return null;
    }

    if (card.status === 'pending') {
      const pendingRow = this.pending().find((p) => p.tempId === card.id);
      if (!pendingRow) {
        return null;
      }

      const key = this.normCode(pendingRow.resultCode);
      return this.resultCodeTemplateByCode()[key] ?? null;
    }

    return this.existingTemplateById()[card.id] ?? null;
  }

  onCardWordingFieldsDTO(
    card: SummaryListCardAction,
    dto: { wordingFields: TemplateSubstitution[] },
  ): void {
    if (!card.id) {
      return;
    }

    if (card.status === 'existing') {
      this.existingWordingDraftById.update((m) => ({
        ...m,
        [card.id!]: dto.wordingFields ?? [],
      }));
      this.handleValidationResponse(card.id, []);
      return;
    }

    if (card.status !== 'pending') {
      return;
    }

    const pendingRow = this.pending().find((row) => row.tempId === card.id);
    if (!pendingRow) {
      this.handleValidationResponse(card.id, []);
      return;
    }

    const updated: PendingResultRow = {
      ...pendingRow,
      wordingFields: dto.wordingFields ?? [],
    };
    this.pending.set([updated]);
    this.pendingChange.emit(this.pending());
    this.handleValidationResponse(card.id, []);
  }

  onCardWordingFieldErrors(
    card: SummaryListCardAction,
    errors: ErrorItem[],
  ): void {
    if (!card.id) {
      return;
    }

    const nextErrors = errors ?? [];

    if (nextErrors.length > 0) {
      this.handleValidationResponse(card.id, nextErrors);
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

  private hasTemplatePlaceholders(template: string): boolean {
    const wordingTemplateTokenizerRegex =
      /\{\{[ \t]{0,50}([^{}\r\n]{1,256})[ \t]{0,50}\}\}/g;

    return wordingTemplateTokenizerRegex.test(template);
  }

  private shouldRenderParserForRow(row: ResultRow): boolean {
    const template = this.getTemplateForRow(row);
    if (!template) {
      return false;
    }

    return this.hasTemplatePlaceholders(template.template ?? '');
  }

  private getTemplateForRow(row: ResultRow): TemplateDetail | null {
    if (row.kind === 'pending') {
      const key = this.normCode(row.resultCode);
      return this.resultCodeTemplateByCode()[key] ?? null;
    }

    return this.existingTemplateById()[row.id] ?? null;
  }

  private readTemplateFromExistingResult(
    result: ResultGetDto,
  ): TemplateDetail | null {
    const wording = (result as ResultGetDto & { wording?: unknown }).wording;
    if (!wording) {
      return null;
    }

    if (typeof wording === 'string') {
      return {
        template: this.unescapeTemplatePlaceholders(wording),
        'substitution-key-constraints': [],
      };
    }

    if (typeof wording === 'object' && 'template' in wording) {
      const template = (
        wording as {
          template?: unknown;
        }
      ).template;

      if (typeof template !== 'string') {
        return null;
      }

      return {
        ...wording,
        template: this.unescapeTemplatePlaceholders(template),
      };
    }

    return null;
  }

  private unescapeTemplatePlaceholders(template: string): string {
    return template.replace(/\\\{\\\{/g, '{{').replace(/\\\}\\\}/g, '}}');
  }

  private getParserCardIdsForSubmit(): string[] {
    return this.existingResultSummaryLists()
      .filter((card) => card.showValue === false && !!card.id)
      .map((card) => card.id!);
  }

  private handleValidationResponse(cardId: string, errors: ErrorItem[]): void {
    if (
      !this.submitValidationRequested ||
      !this.validationTargetCardIds.has(cardId)
    ) {
      return;
    }

    this.validationResolvedCardIds.add(cardId);
    this.validationErrorsByCard.set(cardId, errors ?? []);

    if (
      this.validationResolvedCardIds.size < this.validationTargetCardIds.size
    ) {
      return;
    }

    this.completeSubmitAttempt();
  }

  private completeSubmitAttempt(): void {
    const validationErrors = [...this.validationErrorsByCard.values()].flat();
    this.submitValidationRequested = false;

    if (validationErrors.length > 0) {
      this.emitWordingErrors(validationErrors);
      return;
    }

    this.emitWordingErrors([]);

    const payload = this.buildSubmitPayload();
    if (
      payload.pendingToCreate.length === 0 &&
      payload.existingToUpdate.length === 0
    ) {
      return;
    }

    if (payload.pendingToCreate.length > 0) {
      this.appliedVersion.set(this.pendingVersion());
      this.pending.set([]);
      this.pendingChange.emit(this.pending());
      this.resultCodeSearch = '';
    }

    this.submitResults.emit(payload);
  }

  private buildSubmitPayload(): ResultSectionSubmitPayload {
    const pendingToCreate = this.pending().slice(0, 1);
    const draftById = this.existingWordingDraftById();
    const originalById = this.existingOriginalFieldsById();

    const existingToUpdate = this.existingRows()
      .filter((row) => this.shouldRenderParserForRow(row))
      .map<UpdateExistingResultWordingPayload | null>((row) => {
        const nextFields = draftById[row.id] ?? [];
        const originalFields = originalById[row.id] ?? [];

        if (this.areWordingFieldsEqual(originalFields, nextFields)) {
          return null;
        }

        return {
          resultId: row.id,
          resultCode: row.resultCode,
          wordingFields: nextFields,
        };
      })
      .filter((item): item is UpdateExistingResultWordingPayload => !!item);

    return {
      pendingToCreate,
      existingToUpdate,
    };
  }

  private areWordingFieldsEqual(
    left: TemplateSubstitution[],
    right: TemplateSubstitution[],
  ): boolean {
    const normalize = (items: TemplateSubstitution[]) =>
      [...(items ?? [])]
        .map((item) => ({
          key: (item.key ?? '').trim(),
          value: item.value ?? '',
        }))
        .sort((a, b) => a.key.localeCompare(b.key));

    return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
  }

  private emitWordingErrors(errors: ErrorItem[]): void {
    this.currentWordingErrors.set(errors ?? []);
    this.wordingFieldErrors.emit(errors ?? []);
  }
}
