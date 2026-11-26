import { Given, Then } from '@badeball/cypress-cucumber-preprocessor';

import { PopupWindowHelper } from '../../../../support/helper/window/PopupWindowHelper';

Given('User Starts Capturing Pop Up Windows', () => {
  PopupWindowHelper.captureNextPopup();
});

Then('User Should See Pop Up Window With Title {string}', (title: string) => {
  PopupWindowHelper.verifyTitle(title);
});

Then(
  'User Should See Pop Up Window URL Contains {string}',
  (urlFragment: string) => {
    PopupWindowHelper.verifyUrlContains(urlFragment);
  },
);

Then('User Should See Pop Up Window Named {string}', (name: string) => {
  PopupWindowHelper.verifyWindowName(name);
});

Then('User Should See Pop Up Window Heading {string}', (heading: string) => {
  PopupWindowHelper.verifyHeading(heading);
});

Then('User Closes The Pop Up Window', () => {
  PopupWindowHelper.closeCapturedPopup();
});
