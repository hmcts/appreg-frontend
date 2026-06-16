import { ObjectBuilder } from '../../../../../cypress/support/utils/ObjectBuilder';

describe('ObjectBuilder', () => {
  it('omits legacy null and blank values for backward compatibility', () => {
    expect(
      ObjectBuilder.buildNestedObject({
        standardApplicantCode: 'null',
        paymentReference: '',
        accountNumber: 'ACC-123',
      }),
    ).toEqual({
      accountNumber: 'ACC-123',
    });
  });

  it('builds explicit literal values without omitting the field', () => {
    expect(
      ObjectBuilder.buildNestedObject({
        respondent: '__null__',
        wordingFields: '__empty_array__',
        metadata: '__empty_object__',
        note: '__empty_string__',
      }),
    ).toEqual({
      respondent: null,
      wordingFields: [],
      metadata: {},
      note: '',
    });
  });

  it('builds nested arrays and objects alongside literal values', () => {
    expect(
      ObjectBuilder.buildNestedObject({
        'applicant.person.name.lastName': 'Smith',
        'wordingFields.0.key': 'Date',
        'wordingFields.0.value': '2026-06-15',
        'wordingFields.1.key': 'Venue',
        'wordingFields.1.value': 'Leeds',
        'respondent.person.aliases': '__empty_array__',
      }),
    ).toEqual({
      applicant: {
        person: {
          name: {
            lastName: 'Smith',
          },
        },
      },
      wordingFields: [
        {
          key: 'Date',
          value: '2026-06-15',
        },
        {
          key: 'Venue',
          value: 'Leeds',
        },
      ],
      respondent: {
        person: {
          aliases: [],
        },
      },
    });
  });

  it('builds arrays of primitive values', () => {
    expect(
      ObjectBuilder.buildNestedObject({
        'entryIds.0': '11111111-1111-1111-1111-111111111111',
        'entryIds.1': '22222222-2222-2222-2222-222222222222',
      }),
    ).toEqual({
      entryIds: [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ],
    });
  });
});
