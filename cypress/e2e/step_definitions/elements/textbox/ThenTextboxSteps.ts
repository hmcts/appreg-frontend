import { Then } from '@badeball/cypress-cucumber-preprocessor';
import { TextboxHelper } from '../../../../support/helper/forms/textbox/TextboxHelper';
import { Assertion } from 'chai';

Then('User enters {string} into the {string} textbox', (value: string, field: string) => {
    TextboxHelper.typeInTextbox(field, value);
});

Then('User clears the {string} textbox', (field: string) => {
    TextboxHelper.clearTextbox(field);
});

Then('User verifies the {string} textbox contains {string}', (field: string, value: string) => {
    TextboxHelper.getValueInTextbox(field).then((actualValue) => {
        expect(actualValue).to.equal(value);
    });
});

Then('User verifies the {string} textbox is empty', (field: string) => {
    TextboxHelper.getValueInTextbox(field).then((actualValue) => {
        expect(actualValue).to.be.empty;
    });
});

Then('User verifies the {string} textbox is not empty', (field: string) => {
    TextboxHelper.getValueInTextbox(field).then((actualValue) => {
        expect(actualValue).to.not.be.empty;
    });
});


