Feature: API - Application List Entry

    @api @regression @ARCPOC-229
    Scenario Outline: Create Application List Entry with CJA and Other Location
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                             | durationHours | durationMinutes | otherLocationDescription         | cjaCode |
            | todayiso | timenowhhmm-2h | OPEN   | Applications to review at Test_{RANDOM} | 2             | 22              | Temporary Courtroom at Town Hall | 01      |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Json Body
            """
            {
                "standardApplicantCode": null,
                "applicationCode": "AD99002",
                "applicant": {
                    "person": {
                        "name": {
                            "title": "Mr, Mrs",
                            "surname": "Smith{RANDOM}",
                            "firstForename": "John",
                            "secondForename": "A",
                            "thirdForename": "B"
                        },
                        "contactDetails": {
                            "addressLine1": "{RANDOM} High Street",
                            "addressLine2": "Westminster",
                            "addressLine3": "London",
                            "addressLine4": "Greater London",
                            "addressLine5": "United Kingdom",
                            "postcode": "SW1A 2AA",
                            "phone": "0207{RANDOM}",
                            "mobile": "07123{RANDOM}",
                            "email": "john.smith{RANDOM}@example.com"
                        }
                    }
                },
                "wordingFields": [],
                "feeStatuses": [
                    {
                        "paymentReference": "PAY-{RANDOM}",
                        "paymentStatus": "PAID",
                        "statusDate": "todayiso+1d"
                    }
                ],
                "hasOffsiteFee": false,
                "caseReference": "CASE-001",
                "accountNumber": "APP-{RANDOM}",
                "notes": "Application discussion ref {RANDOM}",
                "lodgementDate": "todayiso",
                "officials": [
                    {
                        "title": "Mr, Mrs",
                        "surname": "Smith{RANDOM}",
                        "forename": "John",
                        "type": "MAGISTRATE"
                    }
                ]
            }
            """
        Then User Verify Response Status Code Should Be "201"
        Examples:
            | User  |
            | user1 |


    @api @regression @ARCPOC-229
    Scenario Outline: Create Application List Entry with Court Location
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                             | durationHours | durationMinutes | courtLocationCode |
            | todayiso | timenowhhmm-2h | OPEN   | Applications to review at Test_{RANDOM} | 2             | 22              | LCCC065           |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | CT99002                        |
            | applicant.person.name.title                   | Mr                             |
            | applicant.person.name.surname                 | Taylor {RANDOM}                |
            | applicant.person.name.firstForename           | Henry                          |
            | applicant.person.name.secondForename          | James                          |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street           |
            | applicant.person.contactDetails.addressLine2  | Westminster                    |
            | applicant.person.contactDetails.addressLine3  | London                         |
            | applicant.person.contactDetails.addressLine4  | Greater London                 |
            | applicant.person.contactDetails.addressLine5  | United Kingdom                 |
            | applicant.person.contactDetails.postcode      | SW1A 1AA                       |
            | applicant.person.contactDetails.phone         | 0203{RANDOM}                   |
            | applicant.person.contactDetails.mobile        | 07123{RANDOM}                  |
            | applicant.person.contactDetails.email         | applicant{RANDOM}@example.com  |
            | respondent.person.name.title                  | Ms                             |
            | respondent.person.name.surname                | Clark {RANDOM}                 |
            | respondent.person.name.firstForename          | Emily                          |
            | respondent.person.name.secondForename         | Rose                           |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road           |
            | respondent.person.contactDetails.addressLine2 | Bristol                        |
            | respondent.person.contactDetails.addressLine3 | Avon                           |
            | respondent.person.contactDetails.addressLine4 | United Kingdom                 |
            | respondent.person.contactDetails.postcode     | BS1 5AA                        |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.dateOfBirth                        | todayiso-25y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | true                           |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-{RANDOM}                   |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
            | officials.0.title                             | Mr                             |
            | officials.0.surname                           | Turner {RANDOM}                |
            | officials.0.forename                          | Graham                         |
            | officials.0.type                              | MAGISTRATE                     |
            | officials.1.title                             | Ms                             |
            | officials.1.surname                           | Hayes {RANDOM}                 |
            | officials.1.forename                          | Laura                          |
            | officials.1.type                              | MAGISTRATE                     |
            | officials.2.title                             | Mr                             |
            | officials.2.surname                           | Miller {RANDOM}                |
            | officials.2.forename                          | Peter                          |
            | officials.2.type                              | CLERK                          |
            | officials.3.title                             | Ms                             |
            | officials.3.surname                           | Patel {RANDOM}                 |
            | officials.3.forename                          | Anita                          |
            | officials.3.type                              | MAGISTRATE                     |
        Then User Verify Response Status Code Should Be "201"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                        | null                                |
            | applicationCode                              | AD99002                             |
            | applicant.person.name.title                  | Mr                                  |
            | applicant.person.name.surname                | Smith {RANDOM}                      |
            | applicant.person.name.firstForename          | John                                |
            | applicant.person.name.secondForename         | A                                   |
            | applicant.person.name.thirdForename          | B                                   |
            | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street                |
            | applicant.person.contactDetails.addressLine2 | Westminster                         |
            | applicant.person.contactDetails.addressLine3 | London                              |
            | applicant.person.contactDetails.addressLine4 | Greater London                      |
            | applicant.person.contactDetails.addressLine5 | United Kingdom                      |
            | applicant.person.contactDetails.postcode     | SW1A 2AA                            |
            | applicant.person.contactDetails.phone        | 0207{RANDOM}                        |
            | applicant.person.contactDetails.mobile       | 07123{RANDOM}                       |
            | applicant.person.contactDetails.email        | john.smith{RANDOM}@example.com      |
            | feeStatuses.0.paymentReference               | PAY-{RANDOM}                        |
            | feeStatuses.0.paymentStatus                  | PAID                                |
            | feeStatuses.0.statusDate                     | todayiso+1d                         |
            | hasOffsiteFee                                | false                               |
            | caseReference                                | CASE-001                            |
            | accountNumber                                | APP-{RANDOM}                        |
            | notes                                        | Application discussion ref {RANDOM} |
            | lodgementDate                                | todayiso                            |
            | officials.0.title                            | Mr                                  |
            | officials.0.surname                          | Smith{RANDOM}                       |
            | officials.0.forename                         | John                                |
            | officials.0.type                             | MAGISTRATE                          |
        Then User Verify Response Status Code Should Be "201"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                           |
            | applicationCode                                     | CT99002                        |
            | applicant.organisation.name                         | Applicant Industries {RANDOM}  |
            | applicant.organisation.contactDetails.addressLine1  | {RANDOM} King Street           |
            | applicant.organisation.contactDetails.addressLine2  | Westminster                    |
            | applicant.organisation.contactDetails.addressLine3  | London                         |
            | applicant.organisation.contactDetails.addressLine4  | Greater London                 |
            | applicant.organisation.contactDetails.addressLine5  | United Kingdom                 |
            | applicant.organisation.contactDetails.postcode      | SW1A 1AA                       |
            | applicant.organisation.contactDetails.phone         | 0203{RANDOM}                   |
            | applicant.organisation.contactDetails.mobile        | 07123{RANDOM}                  |
            | applicant.organisation.contactDetails.email         | applicant{RANDOM}@example.com  |
            | respondent.organisation.name                        | Respondent Industries {RANDOM} |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Market Road           |
            | respondent.organisation.contactDetails.addressLine2 | Bristol                        |
            | respondent.organisation.contactDetails.addressLine3 | Avon                           |
            | respondent.organisation.contactDetails.addressLine4 | United Kingdom                 |
            | respondent.organisation.contactDetails.postcode     | BS1 5AA                        |
            | respondent.organisation.contactDetails.phone        | 0117{RANDOM}                   |
            | respondent.organisation.contactDetails.mobile       | 07984{RANDOM}                  |
            | respondent.organisation.contactDetails.email        | respondent{RANDOM}@example.com |
            | wordingFields.0.key                                 | Reference                      |
            | wordingFields.0.value                               | {RANDOM}                       |
            | hasOffsiteFee                                       | true                           |
            | caseReference                                       | CASE-{RANDOM}                  |
            | accountNumber                                       | ACC-{RANDOM}                   |
            | notes                                               | Case noted with ref {RANDOM}   |
            | lodgementDate                                       | todayiso                       |
            | officials.0.title                                   | Mr                             |
            | officials.0.surname                                 | Turner {RANDOM}                |
            | officials.0.forename                                | Graham                         |
            | officials.0.type                                    | MAGISTRATE                     |
            | officials.1.title                                   | Ms                             |
            | officials.1.surname                                 | Hayes {RANDOM}                 |
            | officials.1.forename                                | Laura                          |
            | officials.1.type                                    | MAGISTRATE                     |
            | officials.2.title                                   | Mr                             |
            | officials.2.surname                                 | Miller {RANDOM}                |
            | officials.2.forename                                | Peter                          |
            | officials.2.type                                    | CLERK                          |
            | officials.3.title                                   | Ms                             |
            | officials.3.surname                                 | Patel {RANDOM}                 |
            | officials.3.forename                                | Anita                          |
            | officials.3.type                                    | MAGISTRATE                     |
        Then User Verify Response Status Code Should Be "201"
        Examples:
            | User  |
            | user1 |