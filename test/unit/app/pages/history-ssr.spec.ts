import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';

import { ResultSelected } from '@components/applications-list-detail/result-selected/result-selected.component';
import { ApplicationsListEntryCreate } from '@components/applications-list-entry-create/applications-list-entry-create.component';
import { PaymentReferenceEditComponent } from '@components/civil-fee-section/payment-reference-edit/payment-reference-edit.component';
import { ApplicationListEntryResultsFacade } from '@services/applications-list-entry/application-list-entry-results.facade';

describe('Navigation state during server initialization', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ApplicationListEntryResultsFacade,
        { provide: PLATFORM_ID, useValue: 'server' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'list-1' }) },
          },
        },
      ],
    });
  });

  it.each([
    ResultSelected,
    ApplicationsListEntryCreate,
    PaymentReferenceEditComponent,
  ])(
    'initializes %p without accessing browser history or redirecting',
    (componentType) => {
      const navigate = jest
        .spyOn(TestBed.inject(Router), 'navigate')
        .mockResolvedValue(true);
      const component = TestBed.runInInjectionContext(
        () => new componentType(),
      );
      const historyAccess = jest
        .spyOn(window, 'history', 'get')
        .mockImplementation(() => {
          throw new ReferenceError('history is not defined');
        });

      try {
        expect(() => component.ngOnInit()).not.toThrow();
        expect(historyAccess).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();

        if (component instanceof ResultSelected) {
          expect(component.listId).toBe('list-1');
          expect(component.rows).toEqual([]);
          expect(component.showRemovedApplicationsAlert()).toBe(false);
        }
        if (component instanceof PaymentReferenceEditComponent) {
          expect(component.row).toBeNull();
          expect(component.paymentReference.value).toBe('');
        }
      } finally {
        historyAccess.mockRestore();
      }
    },
  );
});
