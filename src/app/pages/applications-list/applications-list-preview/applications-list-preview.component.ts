import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, catchError, forkJoin, switchMap } from 'rxjs';

import { ApplicationListStatus, ApplicationListsApi } from '@openapi';
import { PdfService } from '@services/pdf.service';

@Component({
  selector: 'app-applications-list-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="govuk-body" role="status" [hidden]="!status()">{{ status() }}</p>
    <div #preview></div>
  `,
})
export class ApplicationsListPreview {
  protected readonly status = signal('Loading preview…');
  private readonly preview =
    viewChild.required<ElementRef<HTMLElement>>('preview');
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApplicationListsApi);
  private readonly pdf = inject(PdfService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Authenticated data is fetched only in the browser, including on refresh.
    afterNextRender(() => {
      this.route.paramMap
        .pipe(
          switchMap((params) => {
            const container = this.preview().nativeElement;
            container.replaceChildren();
            this.status.set('Loading preview…');
            const listId = params.get('id');
            if (!listId) {
              this.status.set('No application list specified.');
              return EMPTY;
            }
            return forkJoin({
              list: this.api.getApplicationList({ listId }, 'body', false, {
                transferCache: false,
              }),
              dtos: this.api.printApplicationLists(
                {
                  bulkGetApplicationListEntriesRequestDto: {
                    listIds: [listId],
                  },
                },
                undefined,
                undefined,
                { transferCache: false },
              ),
            }).pipe(
              catchError(() => {
                this.status.set('Unable to load preview. Please try again.');
                return EMPTY;
              }),
            );
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(({ list, dtos }) => {
          const container = this.preview().nativeElement;
          const document = container.ownerDocument;
          document.title = `Application List - ${list.description?.trim() || 'Preview print cont'}`;
          if (!dtos.some((dto) => dto.entries.length)) {
            this.status.set('No entries available to print');
            return;
          }
          this.pdf.previewContinuousApplicationLists(
            dtos,
            list.status !== ApplicationListStatus.OPEN,
            document,
            list.description,
            container,
          );
          this.status.set('');
        });
    });
  }
}
