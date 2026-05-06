Feature: Applications Print

    @regression @ARCPOC-1330 @ARCPOC-1329
    Scenario Outline: Print selected applications from Applications search page
        # Setup: Create Application List and Entry via API
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                             | durationHours | durationMinutes | courtLocationCode |
            | todayiso | timenowhhmm-2h | OPEN   | Applications to review at Test_{RANDOM} | 2             | 22              | LCCC065           |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Entry 1 - Standard applicant + Person respondent
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP036                                    |
            | applicationCode                               | CT99002                                   |
            | respondent.person.name.title                  | Mr                                        |
            | respondent.person.name.surname                | Smith {RANDOM}                            |
            | respondent.person.name.firstForename          | John                                      |
            | respondent.person.name.secondForename         | Edward                                    |
            | respondent.person.contactDetails.addressLine1 | 10 Downing Street                         |
            | respondent.person.contactDetails.addressLine2 | Westminster                               |
            | respondent.person.contactDetails.addressLine3 | London                                    |
            | respondent.person.contactDetails.addressLine4 | Greater London                            |
            | respondent.person.contactDetails.addressLine5 | United Kingdom                            |
            | respondent.person.contactDetails.postcode     | SW1A 2AA                                  |
            | respondent.person.contactDetails.phone        | 01225 123456                              |
            | respondent.person.contactDetails.mobile       | 07123456789                               |
            | respondent.person.contactDetails.email        | john-doe@gmail.com                        |
            | respondent.person.dateOfBirth                 | 1990-01-01                                |
            | wordingFields.0.key                           | Reference                                 |
            | wordingFields.0.value                         | TEST-REF-001                              |
            | feeStatuses.0.paymentReference                | PAY-001                                   |
            | feeStatuses.0.paymentStatus                   | PAID                                      |
            | feeStatuses.0.statusDate                      | todayiso                                  |
            | hasOffsiteFee                                 | false                                     |
            | caseReference                                 | CASE-001                                  |
            | accountNumber                                 | ACC-{RANDOM}                              |
            | notes                                         | Standard applicant with person respondent |
            | lodgementDate                                 | todayiso                                  |
            | officials.0.title                             | Mr                                        |
            | officials.0.surname                           | Smith                                     |
            | officials.0.forename                          | John                                      |
            | officials.0.type                              | MAGISTRATE                                |
            | officials.1.title                             | Mrs                                       |
            | officials.1.surname                           | Brown                                     |
            | officials.1.forename                          | Sarah                                     |
            | officials.1.type                              | MAGISTRATE                                |
            | officials.2.title                             | Ms                                        |
            | officials.2.surname                           | Patel                                     |
            | officials.2.forename                          | Anita                                     |
            | officials.2.type                              | MAGISTRATE                                |
            | officials.3.title                             | Mr                                        |
            | officials.3.surname                           | Miller                                    |
            | officials.3.forename                          | Peter                                     |
            | officials.3.type                              | CLERK                                     |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        # Entry 2 - Person applicant + Organisation respondent
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                                          |
            | applicationCode                                     | EF99001                                       |
            | applicant.person.name.title                         | Mrs                                           |
            | applicant.person.name.surname                       | Johnson {RANDOM}                              |
            | applicant.person.name.firstForename                 | Sarah                                         |
            | applicant.person.name.secondForename                | Louise                                        |
            | applicant.person.contactDetails.addressLine1        | 20 High Street                                |
            | applicant.person.contactDetails.addressLine2        | Manchester                                    |
            | applicant.person.contactDetails.addressLine3        | Greater Manchester                            |
            | applicant.person.contactDetails.addressLine4        | England                                       |
            | applicant.person.contactDetails.addressLine5        | United Kingdom                                |
            | applicant.person.contactDetails.postcode            | M1 1AA                                        |
            | applicant.person.contactDetails.phone               | 0161 123456                                   |
            | applicant.person.contactDetails.mobile              | 07987654321                                   |
            | applicant.person.contactDetails.email               | sarah.johnson@example.com                     |
            | respondent.organisation.name                        | Finance Corp LTD {RANDOM}                     |
            | respondent.organisation.contactDetails.addressLine1 | 30 Park Lane                                  |
            | respondent.organisation.contactDetails.addressLine2 | Birmingham                                    |
            | respondent.organisation.contactDetails.addressLine3 | West Midlands                                 |
            | respondent.organisation.contactDetails.addressLine4 | England                                       |
            | respondent.organisation.contactDetails.addressLine5 | United Kingdom                                |
            | respondent.organisation.contactDetails.postcode     | B1 1AA                                        |
            | respondent.organisation.contactDetails.phone        | 0121 456789                                   |
            | respondent.organisation.contactDetails.mobile       | 07812345678                                   |
            | respondent.organisation.contactDetails.email        | info@financecorp.com                          |
            | wordingFields.0.key                                 | account balance                               |
            | wordingFields.0.value                               | 5000                                          |
            | feeStatuses.0.paymentStatus                         | DUE                                           |
            | feeStatuses.0.statusDate                            | todayiso                                      |
            | hasOffsiteFee                                       | false                                         |
            | caseReference                                       | CASE-002                                      |
            | accountNumber                                       | ACC-{RANDOM}                                  |
            | notes                                               | Person applicant with organisation respondent |
            | lodgementDate                                       | todayiso                                      |
            | officials.0.title                                   | Mr                                            |
            | officials.0.surname                                 | Smith                                         |
            | officials.0.forename                                | John                                          |
            | officials.0.type                                    | MAGISTRATE                                    |
            | officials.1.title                                   | Mrs                                           |
            | officials.1.surname                                 | Brown                                         |
            | officials.1.forename                                | Sarah                                         |
            | officials.1.type                                    | MAGISTRATE                                    |
            | officials.2.title                                   | Ms                                            |
            | officials.2.surname                                 | Patel                                         |
            | officials.2.forename                                | Anita                                         |
            | officials.2.type                                    | MAGISTRATE                                    |
            | officials.3.title                                   | Mr                                            |
            | officials.3.surname                                 | Miller                                        |
            | officials.3.forename                                | Peter                                         |
            | officials.3.type                                    | CLERK                                         |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId2"
        # Entry 3 - Organisation applicant + Person respondent
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                              | null                                          |
            | applicationCode                                    | MX99006                                       |
            | applicant.organisation.name                        | ACME Industries LTD {RANDOM}                  |
            | applicant.organisation.contactDetails.addressLine1 | 40 Industrial Estate                          |
            | applicant.organisation.contactDetails.addressLine2 | Leeds                                         |
            | applicant.organisation.contactDetails.addressLine3 | West Yorkshire                                |
            | applicant.organisation.contactDetails.addressLine4 | England                                       |
            | applicant.organisation.contactDetails.addressLine5 | United Kingdom                                |
            | applicant.organisation.contactDetails.postcode     | LS1 1AA                                       |
            | applicant.organisation.contactDetails.phone        | 0113 789456                                   |
            | applicant.organisation.contactDetails.mobile       | 07700123456                                   |
            | applicant.organisation.contactDetails.email        | info@acme.com                                 |
            | respondent.person.name.title                       | Ms                                            |
            | respondent.person.name.surname                     | Williams {RANDOM}                             |
            | respondent.person.name.firstForename               | Emma                                          |
            | respondent.person.name.secondForename              | Jane                                          |
            | respondent.person.contactDetails.addressLine1      | 50 Oak Avenue                                 |
            | respondent.person.contactDetails.addressLine2      | Cardiff                                       |
            | respondent.person.contactDetails.addressLine3      | South Wales                                   |
            | respondent.person.contactDetails.addressLine4      | Wales                                         |
            | respondent.person.contactDetails.addressLine5      | United Kingdom                                |
            | respondent.person.contactDetails.postcode          | CF1 1AA                                       |
            | respondent.person.contactDetails.phone             | 029 2034 5678                                 |
            | respondent.person.contactDetails.mobile            | 07555123456                                   |
            | respondent.person.contactDetails.email             | emma.williams@example.com                     |
            | respondent.person.dateOfBirth                      | 1985-05-15                                    |
            | wordingFields.0.key                                | Describe Seized Food                          |
            | wordingFields.0.value                              | Sample goods batch 123                        |
            | feeStatuses.0.paymentReference                     | PAY-003                                       |
            | feeStatuses.0.paymentStatus                        | PAID                                          |
            | feeStatuses.0.statusDate                           | todayiso                                      |
            | hasOffsiteFee                                      | true                                          |
            | caseReference                                      | CASE-003                                      |
            | accountNumber                                      | ACC-{RANDOM}                                  |
            | notes                                              | Organisation applicant with person respondent |
            | lodgementDate                                      | todayiso                                      |
            | officials.0.title                                  | Mr                                            |
            | officials.0.surname                                | Smith                                         |
            | officials.0.forename                               | John                                          |
            | officials.0.type                                   | MAGISTRATE                                    |
            | officials.1.title                                  | Mrs                                           |
            | officials.1.surname                                | Brown                                         |
            | officials.1.forename                               | Sarah                                         |
            | officials.1.type                                   | MAGISTRATE                                    |
            | officials.2.title                                  | Ms                                            |
            | officials.2.surname                                | Patel                                         |
            | officials.2.forename                               | Anita                                         |
            | officials.2.type                                   | MAGISTRATE                                    |
            | officials.3.title                                  | Mr                                            |
            | officials.3.surname                                | Miller                                        |
            | officials.3.forename                               | Peter                                         |
            | officials.3.type                                   | CLERK                                         |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId3"
        # Entry 4 - Organisation applicant + Organisation respondent (CJA list)
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                             | durationHours | durationMinutes | otherLocationDescription         | cjaCode |
            | todayiso | timenowhhmm-2h | OPEN   | Applications to review at Test_{RANDOM} | 2             | 22              | Temporary Courtroom at Town Hall | 01      |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId2"
        When User Makes POST API Request To "/application-lists/:listId2/entries" With Object Builder:
            | standardApplicantCode                               | null                                                |
            | applicationCode                                     | EF99020                                             |
            | applicant.organisation.name                         | Global Trade Solutions LTD {RANDOM}                 |
            | applicant.organisation.contactDetails.addressLine1  | 100 Business Park                                   |
            | applicant.organisation.contactDetails.addressLine2  | Canary Wharf                                        |
            | applicant.organisation.contactDetails.addressLine3  | London                                              |
            | applicant.organisation.contactDetails.addressLine4  | Greater London                                      |
            | applicant.organisation.contactDetails.addressLine5  | United Kingdom                                      |
            | applicant.organisation.contactDetails.postcode      | E14 5AB                                             |
            | applicant.organisation.contactDetails.phone         | 020 7946 0100                                       |
            | applicant.organisation.contactDetails.mobile        | 07700900100                                         |
            | applicant.organisation.contactDetails.email         | info@globaltradeuk.com                              |
            | respondent.organisation.name                        | Controlled Assets Ltd {RANDOM}                      |
            | respondent.organisation.contactDetails.addressLine1 | 200 Commerce Street                                 |
            | respondent.organisation.contactDetails.addressLine2 | Sheffield                                           |
            | respondent.organisation.contactDetails.addressLine3 | South Yorkshire                                     |
            | respondent.organisation.contactDetails.addressLine4 | England                                             |
            | respondent.organisation.contactDetails.addressLine5 | United Kingdom                                      |
            | respondent.organisation.contactDetails.postcode     | S1 2GU                                              |
            | respondent.organisation.contactDetails.phone        | 0114 496 0200                                       |
            | respondent.organisation.contactDetails.mobile       | 07700900200                                         |
            | respondent.organisation.contactDetails.email        | info@controlledassets.com                           |
            | feeStatuses.0.paymentStatus                         | DUE                                                 |
            | feeStatuses.0.statusDate                            | todayiso                                            |
            | hasOffsiteFee                                       | false                                               |
            | caseReference                                       | CASE-004                                            |
            | accountNumber                                       | ACC-{RANDOM}                                        |
            | notes                                               | Organisation applicant with organisation respondent |
            | lodgementDate                                       | todayiso                                            |
            | officials.0.title                                   | Mr                                                  |
            | officials.0.surname                                 | Smith                                               |
            | officials.0.forename                                | John                                                |
            | officials.0.type                                    | MAGISTRATE                                          |
            | officials.1.title                                   | Mrs                                                 |
            | officials.1.surname                                 | Brown                                               |
            | officials.1.forename                                | Sarah                                               |
            | officials.1.type                                    | MAGISTRATE                                          |
            | officials.2.title                                   | Ms                                                  |
            | officials.2.surname                                 | Patel                                               |
            | officials.2.forename                                | Anita                                               |
            | officials.2.type                                    | MAGISTRATE                                          |
            | officials.3.title                                   | Mr                                                  |
            | officials.3.surname                                 | Miller                                              |
            | officials.3.forename                                | Peter                                               |
            | officials.3.type                                    | CLERK                                               |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId4"
        # Result all 4 entries individually
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId1/results" With Json Body
            """
            {
            "resultCode": "RSN",
            "wordingFields": [
            {
            "key": "Reason text",
            "value": "Applications rejected due to insufficient documentation and missing required signatures"
            }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId2/results" With Json Body
            """
            {
            "resultCode": "RSN",
            "wordingFields": [
            {
            "key": "Reason text",
            "value": "Applications rejected due to insufficient documentation and missing required signatures"
            }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId3/results" With Json Body
            """
            {
            "resultCode": "RSN",
            "wordingFields": [
            {
            "key": "Reason text",
            "value": "Applications rejected due to insufficient documentation and missing required signatures"
            }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"
        When User Makes POST API Request To "/application-lists/:listId2/entries/:entryId4/results" With Json Body
            """
            {
            "resultCode": "RSN",
            "wordingFields": [
            {
            "key": "Reason text",
            "value": "Applications rejected due to insufficient documentation and missing required signatures"
            }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"
        # UI: Search and Print
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link Using Exact Text Match "Applications"
        Then User Verify The Page URL Contains "/applications"
        When User Searches Applications With:
            | Date  | CourtSearch | Court | Applicant organisation | Applicant surname | Respondent organisation | Respondent surname | Select application status | Respondent post code | CJASearch | Criminal justice area | Other location description | Standard applicant code | Account reference |
            | today |             |       |                        |                   |                         |                    |                           |                      |           |                       |                            |                         | ACC-{RANDOM}      |
        Then User Should See Row In Table "Application list entries" With Values:
            | Date         | Applicant                           | Respondent                     | Application title                                      | Fee | Resulted | Status |
            | todaydisplay | Innovative Solutions Inc            | John Smith {RANDOM}            | Issue of liability order summons - council tax         | No  | Yes      | OPEN   |
            | todaydisplay | Sarah Johnson {RANDOM}              | Finance Corp LTD {RANDOM}      | Collection Order - Financial Penalty Account           | No  | Yes      | OPEN   |
            | todaydisplay | ACME Industries LTD {RANDOM}        | Emma Williams {RANDOM}         | Condemnation of Unfit Food                             | Yes | Yes      | OPEN   |
            | todaydisplay | Global Trade Solutions LTD {RANDOM} | Controlled Assets Ltd {RANDOM} | Order for the disposal of uncollected controlled goods | No  | Yes      | OPEN   |
        When User Checks The Select All Checkbox In Table "Application list entries"
        When User Clicks "Actions" Then "Print continuous" From Caption Menu In Table "Application list entries"
        Then User Verifies PDF "applications-todayiso-print-cont" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Contains Text "Check List Report"
        Then User Verifies Latest Downloaded PDF Contains 4 "Applicant" Entries
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Applicant              | Innovative Solutions Inc                                                                            |
            | Respondent             | Mr John Edward Smith {RANDOM}                                                                       |
            | Case Reference         | CASE-001                                                                                            |
            | Application Code       | CT99002                                                                                             |
            | Account Reference      | ACC-{RANDOM}                                                                                        |
            | Application Title      | Issue of liability order summons - council tax                                                      |
            | Notes                  | Standard applicant with person respondent                                                           |
            | This matter was before | Mr Smith John MAGISTRATE Mrs Brown Sarah MAGISTRATE Ms Patel Anita MAGISTRATE Mr Miller Peter CLERK |
            | Applicant              | Mrs Sarah Louise Johnson {RANDOM}                                                                   |
            | Respondent             | Finance Corp LTD {RANDOM}                                                                           |
            | Case Reference         | CASE-002                                                                                            |
            | Application Code       | EF99001                                                                                             |
            | Account Reference      | ACC-{RANDOM}                                                                                        |
            | Application Title      | Collection Order - Financial Penalty Account                                                        |
            | Notes                  | Person applicant with organisation respondent                                                       |
            | This matter was before | Mr Smith John MAGISTRATE Mrs Brown Sarah MAGISTRATE Ms Patel Anita MAGISTRATE Mr Miller Peter CLERK |
            | Applicant              | ACME Industries LTD {RANDOM}                                                                        |
            | Respondent             | Ms Emma Jane Williams {RANDOM}                                                                      |
            | Case Reference         | CASE-003                                                                                            |
            | Application Code       | MX99006                                                                                             |
            | Account Reference      | ACC-{RANDOM}                                                                                        |
            | Application Title      | Condemnation of Unfit Food                                                                          |
            | Result                 | Reasons: {Applications rejected due to insufficient documentation and missing required signatures}. |
            | Notes                  | Organisation applicant with person respondent                                                       |
            | This matter was before | Mr Smith John MAGISTRATE Mrs Brown Sarah MAGISTRATE Ms Patel Anita MAGISTRATE Mr Miller Peter CLERK |
            | Applicant              | Global Trade Solutions LTD {RANDOM}                                                                 |
            | Respondent             | Controlled Assets Ltd {RANDOM}                                                                      |
            | Case Reference         | CASE-004                                                                                            |
            | Application Code       | EF99020                                                                                             |
            | Account Reference      | ACC-{RANDOM}                                                                                        |
            | Application Title      | Order for the disposal of uncollected controlled goods                                              |
            | Result                 | Reasons: {Applications rejected due to insufficient documentation and missing required signatures}. |
            | Notes                  | Organisation applicant with organisation respondent                                                 |
            | This matter was before | Mr Smith John MAGISTRATE Mrs Brown Sarah MAGISTRATE Ms Patel Anita MAGISTRATE Mr Miller Peter CLERK |
        Then User Clears Downloaded PDFs
        When User Clicks "Actions" Then "Print page" From Caption Menu In Table "Application list entries"
        Then User Verifies PDF "applications-todayiso-print-page" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Contains Text "Leeds Combined Court Centre Set 7"
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Application brought by | Innovative Solutions Inc                                                                            |
            | Respondent             | Mr John Edward Smith {RANDOM}                                                                       |
            | Matter considered      | Issue of liability order summons - council tax                                                      |
            | This matter was before | Mr Smith John MAGISTRATE Mrs Brown Sarah MAGISTRATE Ms Patel Anita MAGISTRATE Mr Miller Peter CLERK |
            | Dated                  | todaydisplaylong                                                                                    |
            | Produced on            | todaydisplaylong                                                                                    |
            | Application brought by | Mrs Sarah Louise Johnson {RANDOM}                                                                   |
            | Respondent             | Finance Corp LTD {RANDOM}                                                                           |
            | Matter considered      | Collection Order - Financial Penalty Account                                                        |
            | This matter was before | Mr Smith John MAGISTRATE Mrs Brown Sarah MAGISTRATE Ms Patel Anita MAGISTRATE Mr Miller Peter CLERK |
            | Dated                  | todaydisplaylong                                                                                    |
            | Produced on            | todaydisplaylong                                                                                    |
            | Application brought by | ACME Industries LTD {RANDOM}                                                                        |
            | Respondent             | Ms Emma Jane Williams {RANDOM}                                                                      |
            | Matter considered      | Condemnation of Unfit Food                                                                          |
            | This matter was before | Mr Smith John MAGISTRATE Mrs Brown Sarah MAGISTRATE Ms Patel Anita MAGISTRATE Mr Miller Peter CLERK |
            | Dated                  | todaydisplaylong                                                                                    |
            | Produced on            | todaydisplaylong                                                                                    |
            | Application brought by | Global Trade Solutions LTD {RANDOM}                                                                 |
            | Respondent             | Controlled Assets Ltd {RANDOM}                                                                      |
            | Matter considered      | Order for the disposal of uncollected controlled goods                                              |
            | This matter was before | Mr Smith John MAGISTRATE Mrs Brown Sarah MAGISTRATE Ms Patel Anita MAGISTRATE Mr Miller Peter CLERK |
            | Dated                  | todaydisplaylong                                                                                    |
            | Produced on            | todaydisplaylong                                                                                    |
        Then User Clears Downloaded PDFs
        # Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        When User Makes DELETE API Request To "/application-lists/:listId2"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  |
            | user1 |
