import { DataTable, When } from '@badeball/cypress-cucumber-preprocessor';

import { ConfirmationHelper } from '../../../../support/helper/window/ConfirmationHelper';
import { PopupWindowHelper } from '../../../../support/helper/window/PopupWindowHelper';

When('User Accepts The Confirmation Dialog', () => {
  ConfirmationHelper.acceptNextConfirm();
});

When('User Cancels The Confirmation Dialog', () => {
  ConfirmationHelper.dismissNextConfirm();
});

When(
  'User Accepts The Confirmation Dialog With Message {string}',
  (message: string) => {
    ConfirmationHelper.acceptNextConfirm(message);
  },
);

When(
  'User Cancels The Confirmation Dialog With Message {string}',
  (message: string) => {
    ConfirmationHelper.dismissNextConfirm(message);
  },
);

When('User Opens The Captured Pop Up Window', () => {
  PopupWindowHelper.visitCapturedPopup();
});

When(
  'User Should See Pop Up Window Contain The Following Values:',
  (dataTable: DataTable) => {
    PopupWindowHelper.verifySummaryValues(
      dataTable.raw().map(([Label, Value]) => ({ Label, Value })),
    );
  },
);
