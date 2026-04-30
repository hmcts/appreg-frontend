Feature: Application List Entries Search

    @regression @applicationsList @applicationListEntry
    Scenario Outline: Application List - Search Entries - Mixed Applicants, Respondents, Fees And Results
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Entry 1 - Person applicant + Person respondent, no fee, resulted
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | CT99002                        |
            | applicant.person.name.title                   | Mr                             |
            | applicant.person.name.surname                 | Taylor {RANDOM}                |
            | applicant.person.name.firstForename           | Henry                          |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street           |
            | applicant.person.contactDetails.addressLine2  | Westminster                    |
            | applicant.person.contactDetails.addressLine3  | London                         |
            | applicant.person.contactDetails.postcode      | SW1A 1AA                       |
            | applicant.person.contactDetails.phone         | 01632960001                    |
            | applicant.person.contactDetails.mobile        | 07700900001                    |
            | applicant.person.contactDetails.email         | applicant{RANDOM}@example.com  |
            | respondent.person.name.title                  | Ms                             |
            | respondent.person.name.surname                | Clark {RANDOM}                 |
            | respondent.person.name.firstForename          | Emily                          |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road           |
            | respondent.person.contactDetails.addressLine2 | Bristol                        |
            | respondent.person.contactDetails.postcode     | BS15 5AA                       |
            | respondent.person.contactDetails.phone        | 01632960001                    |
            | respondent.person.contactDetails.mobile       | 07700900001                    |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-25y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASEE1{RANDOM}                 |
            | accountNumber                                 | ACCSE1{RANDOM}                 |
            | notes                                         | Entry search person person     |
            | lodgementDate                                 | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId1/results" With Json Body
            """
            {
            "resultCode": "AUTH"
            }
            """
        Then User Verify Response Status Code Should Be "201"
        # Entry 2 - Organisation applicant + Organisation respondent, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                           |
            | applicationCode                                     | EF99001                        |
            | applicant.organisation.name                         | Finance Authority {RANDOM}     |
            | applicant.organisation.contactDetails.addressLine1  | {RANDOM} Ledger Street         |
            | applicant.organisation.contactDetails.addressLine2  | Manchester                     |
            | applicant.organisation.contactDetails.postcode      | M1 1AA                         |
            | applicant.organisation.contactDetails.phone         | 01632960001                    |
            | applicant.organisation.contactDetails.mobile        | 07700900001                    |
            | applicant.organisation.contactDetails.email         | applicant{RANDOM}@example.com  |
            | respondent.organisation.name                        | Payment Services Ltd {RANDOM}  |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Park Lane             |
            | respondent.organisation.contactDetails.addressLine2 | Birmingham                     |
            | respondent.organisation.contactDetails.postcode     | B1 1AA                         |
            | respondent.organisation.contactDetails.phone        | 01632960001                    |
            | respondent.organisation.contactDetails.mobile       | 07700900001                    |
            | respondent.organisation.contactDetails.email        | respondent{RANDOM}@example.com |
            | wordingFields.0.key                                 | account balance                |
            | wordingFields.0.value                               | {RANDOM}                       |
            | hasOffsiteFee                                       | false                          |
            | caseReference                                       | CASEE2{RANDOM}                 |
            | accountNumber                                       | ACCSE2{RANDOM}                 |
            | notes                                               | Entry search organisation org  |
            | lodgementDate                                       | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        # Entry 3 - Standard applicant + Person respondent, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP036                         |
            | applicationCode                               | CT99002                        |
            | respondent.person.name.title                  | Mr                             |
            | respondent.person.name.surname                | Davies {RANDOM}                |
            | respondent.person.name.firstForename          | Owen                           |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Castle Road           |
            | respondent.person.contactDetails.addressLine2 | Leeds                          |
            | respondent.person.contactDetails.postcode     | LS1 1AA                        |
            | respondent.person.contactDetails.phone        | 01632960001                    |
            | respondent.person.contactDetails.mobile       | 07700900001                    |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-35y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASEE3{RANDOM}                 |
            | accountNumber                                 | ACCSE3{RANDOM}                 |
            | notes                                         | Entry search standard person   |
            | lodgementDate                                 | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        # Entry 4 - Person applicant + Organisation respondent, fee required
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                           |
            | applicationCode                                     | MX99006                        |
            | applicant.person.name.title                         | Mrs                            |
            | applicant.person.name.surname                       | Morgan {RANDOM}                |
            | applicant.person.name.firstForename                 | Fiona                          |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} West Street           |
            | applicant.person.contactDetails.addressLine2        | Leicester                      |
            | applicant.person.contactDetails.postcode            | LE1 1AA                        |
            | applicant.person.contactDetails.phone               | 01632960001                    |
            | applicant.person.contactDetails.mobile              | 07700900001                    |
            | applicant.person.contactDetails.email               | applicant{RANDOM}@example.com  |
            | respondent.organisation.name                        | Civic Respondent Ltd {RANDOM}  |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Victoria Road         |
            | respondent.organisation.contactDetails.addressLine2 | Cardiff                        |
            | respondent.organisation.contactDetails.postcode     | CF1 1AA                        |
            | respondent.organisation.contactDetails.phone        | 01632960001                    |
            | respondent.organisation.contactDetails.mobile       | 07700900001                    |
            | respondent.organisation.contactDetails.email        | respondent{RANDOM}@example.com |
            | wordingFields.0.key                                 | Describe Seized Food           |
            | wordingFields.0.value                               | Search sample goods {RANDOM}   |
            | feeStatuses.0.paymentReference                      |                                |
            | feeStatuses.0.paymentStatus                         | DUE                            |
            | feeStatuses.0.statusDate                            | todayiso                       |
            | hasOffsiteFee                                       | false                          |
            | caseReference                                       | CASEE4{RANDOM}                 |
            | accountNumber                                       | ACCSE4{RANDOM}                 |
            | notes                                               | Entry search person org fee    |
            | lodgementDate                                       | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        # Entry 5 - Organisation applicant + Person respondent, fee required, resulted
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                              | null                           |
            | applicationCode                                    | MX99006                        |
            | applicant.organisation.name                        | Registry Services {RANDOM}     |
            | applicant.organisation.contactDetails.addressLine1 | {RANDOM} Industrial Park       |
            | applicant.organisation.contactDetails.addressLine2 | Newcastle                      |
            | applicant.organisation.contactDetails.postcode     | NE1 1AA                        |
            | applicant.organisation.contactDetails.phone        | 01632960001                    |
            | applicant.organisation.contactDetails.mobile       | 07700900001                    |
            | applicant.organisation.contactDetails.email        | applicant{RANDOM}@example.com  |
            | respondent.person.name.title                       | Mr                             |
            | respondent.person.name.surname                     | Wilson {RANDOM}                |
            | respondent.person.name.firstForename               | Liam                           |
            | respondent.person.contactDetails.addressLine1      | {RANDOM} Quayside              |
            | respondent.person.contactDetails.addressLine2      | Newcastle                      |
            | respondent.person.contactDetails.postcode          | NE1 2AA                        |
            | respondent.person.contactDetails.phone             | 01632960001                    |
            | respondent.person.contactDetails.mobile            | 07700900001                    |
            | respondent.person.contactDetails.email             | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                      | todayiso-44y                   |
            | wordingFields.0.key                                | Describe Seized Food           |
            | wordingFields.0.value                              | Search sample items {RANDOM}   |
            | feeStatuses.0.paymentReference                     | PAY-E5-{RANDOM}                |
            | feeStatuses.0.paymentStatus                        | PAID                           |
            | feeStatuses.0.statusDate                           | todayiso                       |
            | hasOffsiteFee                                      | false                          |
            | caseReference                                      | CASEE5{RANDOM}                 |
            | accountNumber                                      | ACCSE5{RANDOM}                 |
            | notes                                              | Entry search org person fee    |
            | lodgementDate                                      | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId5"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId5/results" With Json Body
            """
            {
            "resultCode": "AUTH"
            }
            """
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description | CourtSearch         | Court   | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      |             | <courtLocationCode> | <Court> |        |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Should See Table "Entries" Has Sortable Headers "Sequence number, Account number, Applicant, Respondent, Postcode, Title, Fee, Resulted"
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number | Applicant                  | Respondent                    | Postcode | Title                                          | Fee | Resulted |
            | 1               | ACCSE1{RANDOM} | Henry Taylor {RANDOM}      | Emily Clark {RANDOM}          | BS15 5AA | Issue of liability order summons - council tax | No  | AUTH     |
            | 2               | ACCSE2{RANDOM} | Finance Authority {RANDOM} | Payment Services Ltd {RANDOM} | B1 1AA   | Collection Order - Financial Penalty Account   | No  |          |
            | 3               | ACCSE3{RANDOM} | Innovative Solutions Inc   | Owen Davies {RANDOM}          | LS1 1AA  | Issue of liability order summons - council tax | No  |          |
            | 4               | ACCSE4{RANDOM} | Fiona Morgan {RANDOM}      | Civic Respondent Ltd {RANDOM} | CF1 1AA  | Condemnation of Unfit Food                     | Yes |          |
            | 5               | ACCSE5{RANDOM} | Registry Services {RANDOM} | Liam Wilson {RANDOM}          | NE1 2AA  | Condemnation of Unfit Food                     | Yes | AUTH     |
        # Search by applicant across person, organisation and standard applicant entries
        When User Searches Application List Entries With:
            | Applicant             | Respondent | Respondent postcode | Sequence number | Account number | Application title | Fee | Resulted |
            | Henry Taylor {RANDOM} |            |                     |                 |                |                   |     |          |
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number | Applicant             | Respondent           | Postcode | Title                                          | Fee | Resulted |
            | 1               | ACCSE1{RANDOM} | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | BS15 5AA | Issue of liability order summons - council tax | No  | AUTH     |
        # Search by respondent across organisation and person respondents
        When User Searches Application List Entries With:
            | Applicant | Respondent                    | Respondent postcode | Sequence number | Account number | Application title | Fee | Resulted |
            |           | Civic Respondent Ltd {RANDOM} | CF1 1AA             |                 |                |                   |     |          |
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number | Applicant             | Respondent                    | Postcode | Title                      | Fee | Resulted |
            | 4               | ACCSE4{RANDOM} | Fiona Morgan {RANDOM} | Civic Respondent Ltd {RANDOM} | CF1 1AA  | Condemnation of Unfit Food | Yes |          |
        # Search fee and resulted filters
        When User Searches Application List Entries With:
            | Applicant | Respondent | Respondent postcode | Sequence number | Account number | Application title | Fee | Resulted |
            |           |            |                     |                 |                |                   | Yes |          |
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number | Applicant                  | Respondent                    | Postcode | Title                      | Fee | Resulted |
            | 4               | ACCSE4{RANDOM} | Fiona Morgan {RANDOM}      | Civic Respondent Ltd {RANDOM} | CF1 1AA  | Condemnation of Unfit Food | Yes |          |
            | 5               | ACCSE5{RANDOM} | Registry Services {RANDOM} | Liam Wilson {RANDOM}          | NE1 2AA  | Condemnation of Unfit Food | Yes | AUTH     |
        When User Searches Application List Entries With:
            | Applicant | Respondent | Respondent postcode | Sequence number | Account number | Application title | Fee | Resulted |
            |           |            |                     |                 |                |                   |     | AUTH     |
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number | Applicant                  | Respondent           | Postcode | Title                                          | Fee | Resulted |
            | 1               | ACCSE1{RANDOM} | Henry Taylor {RANDOM}      | Emily Clark {RANDOM} | BS15 5AA | Issue of liability order summons - council tax | No  | AUTH     |
            | 5               | ACCSE5{RANDOM} | Registry Services {RANDOM} | Liam Wilson {RANDOM} | NE1 2AA  | Condemnation of Unfit Food                     | Yes | AUTH     |
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | Status | Description                             | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                     |
            | user2 | todayiso | timenowhhmm-3h | OPEN   | Applications to review at Test_{RANDOM} | BCC026            | today      | todayDisplay | 5       | Bristol Crown Court Set 3 |
