Feature: API - Test Data Setup - 40 ALEs

    @api @testdata
    Scenario: Create Application List With 40 Mixed ALEs for Test Data
        Given User Authenticates Via API As "user1"
        # Create the Application List
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                     | courtLocationCode |
            | todayiso | timenowhhmm-2h | OPEN   | Test Data List 40 ALEs {RANDOM} | LCCC065           |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        Then User Stores Response Body Property "description" As "listDescription"

        # ===========================================================
        # GROUP 1 (E1-E10): Person Applicant
        # ===========================================================

        # Entry 1 - Person applicant + Person respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                            |
            | applicationCode                               | CT99002                         |
            | applicant.person.name.title                   | Mr                              |
            | applicant.person.name.surname                 | Adams {RANDOM}                  |
            | applicant.person.name.firstForename           | James                           |
            | applicant.person.name.secondForename          | Edward                          |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} Baker Street           |
            | applicant.person.contactDetails.addressLine2  | London                          |
            | applicant.person.contactDetails.addressLine3  | Greater London                  |
            | applicant.person.contactDetails.postcode      | NW1 6XE                         |
            | applicant.person.contactDetails.phone         | 0207{RANDOM}                    |
            | applicant.person.contactDetails.mobile        | 07100{RANDOM}                   |
            | applicant.person.contactDetails.email         | applicant.e1.{RANDOM}@test.com  |
            | respondent.person.name.title                  | Ms                              |
            | respondent.person.name.surname                | Brown {RANDOM}                  |
            | respondent.person.name.firstForename          | Alice                           |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Oxford Road            |
            | respondent.person.contactDetails.addressLine2 | Manchester                      |
            | respondent.person.contactDetails.postcode     | M1 1AA                          |
            | respondent.person.contactDetails.phone        | 0161{RANDOM}                    |
            | respondent.person.contactDetails.mobile       | 07200{RANDOM}                   |
            | respondent.person.contactDetails.email        | respondent.e1.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-28y                    |
            | wordingFields.0.key                           | Reference                       |
            | wordingFields.0.value                         | {RANDOM}                        |
            | hasOffsiteFee                                 | true                            |
            | caseReference                                 | CASE-E1-{RANDOM}                |
            | accountNumber                                 | ACC-E1-{RANDOM}                 |
            | notes                                         | E1 Person+Person with fee       |
            | lodgementDate                                 | todayiso                        |
        Then User Verify Response Status Code Should Be "201"

        # Entry 2 - Person applicant + Person respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                            |
            | applicationCode                               | EF99001                         |
            | applicant.person.name.title                   | Mrs                             |
            | applicant.person.name.surname                 | Clarke {RANDOM}                 |
            | applicant.person.name.firstForename           | Sarah                           |
            | applicant.person.name.secondForename          | Louise                          |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} High Street            |
            | applicant.person.contactDetails.addressLine2  | Birmingham                      |
            | applicant.person.contactDetails.postcode      | B1 1AA                          |
            | applicant.person.contactDetails.phone         | 0121{RANDOM}                    |
            | applicant.person.contactDetails.mobile        | 07300{RANDOM}                   |
            | applicant.person.contactDetails.email         | applicant.e2.{RANDOM}@test.com  |
            | respondent.person.name.title                  | Mr                              |
            | respondent.person.name.surname                | Davies {RANDOM}                 |
            | respondent.person.name.firstForename          | Thomas                          |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Mill Lane              |
            | respondent.person.contactDetails.addressLine2 | Leeds                           |
            | respondent.person.contactDetails.postcode     | LS1 1AA                         |
            | respondent.person.contactDetails.phone        | 0113{RANDOM}                    |
            | respondent.person.contactDetails.mobile       | 07400{RANDOM}                   |
            | respondent.person.contactDetails.email        | respondent.e2.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-32y                    |
            | wordingFields.0.key                           | account balance                 |
            | wordingFields.0.value                         | {RANDOM}                        |
            | hasOffsiteFee                                 | false                           |
            | caseReference                                 | CASE-E2-{RANDOM}                |
            | accountNumber                                 | ACC-E2-{RANDOM}                 |
            | notes                                         | E2 Person+Person no fee         |
            | lodgementDate                                 | todayiso                        |
        Then User Verify Response Status Code Should Be "201"

        # Entry 3 - Person applicant + Person respondent, CT99002, no offsite fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                            |
            | applicationCode                               | CT99002                         |
            | applicant.person.name.title                   | Mr                              |
            | applicant.person.name.surname                 | Evans {RANDOM}                  |
            | applicant.person.name.firstForename           | Daniel                          |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} Station Road           |
            | applicant.person.contactDetails.addressLine2  | Bristol                         |
            | applicant.person.contactDetails.postcode      | BS1 1AA                         |
            | applicant.person.contactDetails.phone         | 0117{RANDOM}                    |
            | applicant.person.contactDetails.mobile        | 07500{RANDOM}                   |
            | applicant.person.contactDetails.email         | applicant.e3.{RANDOM}@test.com  |
            | respondent.person.name.title                  | Miss                            |
            | respondent.person.name.surname                | Foster {RANDOM}                 |
            | respondent.person.name.firstForename          | Emma                            |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Park Avenue            |
            | respondent.person.contactDetails.addressLine2 | Liverpool                       |
            | respondent.person.contactDetails.postcode     | L1 1AA                          |
            | respondent.person.contactDetails.phone        | 0151{RANDOM}                    |
            | respondent.person.contactDetails.mobile       | 07600{RANDOM}                   |
            | respondent.person.contactDetails.email        | respondent.e3.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-22y                    |
            | wordingFields.0.key                           | Reference                       |
            | wordingFields.0.value                         | {RANDOM}                        |
            | hasOffsiteFee                                 | false                           |
            | caseReference                                 | CASE-E3-{RANDOM}                |
            | accountNumber                                 | ACC-E3-{RANDOM}                 |
            | notes                                         | E3 Person+Person no offsite fee |
            | lodgementDate                                 | todayiso                        |
        Then User Verify Response Status Code Should Be "201"

        # Entry 4 - Person applicant + Organisation respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                            |
            | applicationCode                                     | CT99002                         |
            | applicant.person.name.title                         | Ms                              |
            | applicant.person.name.surname                       | Green {RANDOM}                  |
            | applicant.person.name.firstForename                 | Laura                           |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} Church Street          |
            | applicant.person.contactDetails.addressLine2        | Sheffield                       |
            | applicant.person.contactDetails.postcode            | S1 1AA                          |
            | applicant.person.contactDetails.phone               | 0114{RANDOM}                    |
            | applicant.person.contactDetails.mobile              | 07700{RANDOM}                   |
            | applicant.person.contactDetails.email               | applicant.e4.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Green Corp {RANDOM}             |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Commerce Way           |
            | respondent.organisation.contactDetails.addressLine2 | Newcastle                       |
            | respondent.organisation.contactDetails.postcode     | NE1 1AA                         |
            | respondent.organisation.contactDetails.phone        | 0191{RANDOM}                    |
            | respondent.organisation.contactDetails.mobile       | 07800{RANDOM}                   |
            | respondent.organisation.contactDetails.email        | respondent.e4.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                       |
            | wordingFields.0.value                               | {RANDOM}                        |
            | hasOffsiteFee                                       | true                            |
            | caseReference                                       | CASE-E4-{RANDOM}                |
            | accountNumber                                       | ACC-E4-{RANDOM}                 |
            | notes                                               | E4 Person+Org with fee          |
            | lodgementDate                                       | todayiso                        |
        Then User Verify Response Status Code Should Be "201"

        # Entry 5 - Person applicant + Organisation respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                            |
            | applicationCode                                     | EF99001                         |
            | applicant.person.name.title                         | Mr                              |
            | applicant.person.name.surname                       | Harris {RANDOM}                 |
            | applicant.person.name.firstForename                 | Oliver                          |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} Queen Street           |
            | applicant.person.contactDetails.addressLine2        | Edinburgh                       |
            | applicant.person.contactDetails.postcode            | EH1 1AA                         |
            | applicant.person.contactDetails.phone               | 0131{RANDOM}                    |
            | applicant.person.contactDetails.mobile              | 07900{RANDOM}                   |
            | applicant.person.contactDetails.email               | applicant.e5.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Harris Holdings {RANDOM}        |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Victoria Road          |
            | respondent.organisation.contactDetails.addressLine2 | Cardiff                         |
            | respondent.organisation.contactDetails.postcode     | CF1 1AA                         |
            | respondent.organisation.contactDetails.phone        | 0292{RANDOM}                    |
            | respondent.organisation.contactDetails.mobile       | 07910{RANDOM}                   |
            | respondent.organisation.contactDetails.email        | respondent.e5.{RANDOM}@test.com |
            | wordingFields.0.key                                 | account balance                 |
            | wordingFields.0.value                               | {RANDOM}                        |
            | hasOffsiteFee                                       | false                           |
            | caseReference                                       | CASE-E5-{RANDOM}                |
            | accountNumber                                       | ACC-E5-{RANDOM}                 |
            | notes                                               | E5 Person+Org no fee            |
            | lodgementDate                                       | todayiso                        |
        Then User Verify Response Status Code Should Be "201"

        # Entry 6 - Person applicant + Organisation respondent, CT99002, no offsite fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                            |
            | applicationCode                                     | CT99002                         |
            | applicant.person.name.title                         | Mrs                             |
            | applicant.person.name.surname                       | Jackson {RANDOM}                |
            | applicant.person.name.firstForename                 | Helen                           |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} Bridge Road            |
            | applicant.person.contactDetails.addressLine2        | Nottingham                      |
            | applicant.person.contactDetails.postcode            | NG1 1AA                         |
            | applicant.person.contactDetails.phone               | 0115{RANDOM}                    |
            | applicant.person.contactDetails.mobile              | 07920{RANDOM}                   |
            | applicant.person.contactDetails.email               | applicant.e6.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Jackson & Sons {RANDOM}         |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Industrial Park        |
            | respondent.organisation.contactDetails.addressLine2 | Coventry                        |
            | respondent.organisation.contactDetails.postcode     | CV1 1AA                         |
            | respondent.organisation.contactDetails.phone        | 0247{RANDOM}                    |
            | respondent.organisation.contactDetails.mobile       | 07930{RANDOM}                   |
            | respondent.organisation.contactDetails.email        | respondent.e6.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                       |
            | wordingFields.0.value                               | {RANDOM}                        |
            | hasOffsiteFee                                       | false                           |
            | caseReference                                       | CASE-E6-{RANDOM}                |
            | accountNumber                                       | ACC-E6-{RANDOM}                 |
            | notes                                               | E6 Person+Org no offsite fee    |
            | lodgementDate                                       | todayiso                        |
        Then User Verify Response Status Code Should Be "201"

        # Entry 7 - Person applicant + Person respondent, CT99002, with fee → result applied
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                            |
            | applicationCode                               | CT99002                         |
            | applicant.person.name.title                   | Mr                              |
            | applicant.person.name.surname                 | King {RANDOM}                   |
            | applicant.person.name.firstForename           | William                         |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} King's Road            |
            | applicant.person.contactDetails.addressLine2  | London                          |
            | applicant.person.contactDetails.postcode      | SW3 4AA                         |
            | applicant.person.contactDetails.phone         | 0207{RANDOM}                    |
            | applicant.person.contactDetails.mobile        | 07940{RANDOM}                   |
            | applicant.person.contactDetails.email         | applicant.e7.{RANDOM}@test.com  |
            | respondent.person.name.title                  | Mrs                             |
            | respondent.person.name.surname                | Lewis {RANDOM}                  |
            | respondent.person.name.firstForename          | Charlotte                       |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Abbey Road             |
            | respondent.person.contactDetails.addressLine2 | London                          |
            | respondent.person.contactDetails.postcode     | NW8 9AY                         |
            | respondent.person.contactDetails.phone        | 0208{RANDOM}                    |
            | respondent.person.contactDetails.mobile       | 07950{RANDOM}                   |
            | respondent.person.contactDetails.email        | respondent.e7.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-40y                    |
            | wordingFields.0.key                           | Reference                       |
            | wordingFields.0.value                         | {RANDOM}                        |
            | hasOffsiteFee                                 | true                            |
            | caseReference                                 | CASE-E7-{RANDOM}                |
            | accountNumber                                 | ACC-E7-{RANDOM}                 |
            | notes                                         | E7 Person+Person with fee       |
            | lodgementDate                                 | todayiso                        |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Json Body
            """
            {
            "resultCode": "RTC",
            "wordingFields": [
            { "key": "Date", "value": "todayiso" },
            { "key": "Courthouse", "value": "Leeds Combined Court Centre" }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"

        # Entry 8 - Person applicant + Organisation respondent, EF99001, no fee → result applied
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                            |
            | applicationCode                                     | EF99001                         |
            | applicant.person.name.title                         | Ms                              |
            | applicant.person.name.surname                       | Morgan {RANDOM}                 |
            | applicant.person.name.firstForename                 | Fiona                           |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} West Street            |
            | applicant.person.contactDetails.addressLine2        | Leicester                       |
            | applicant.person.contactDetails.postcode            | LE1 1AA                         |
            | applicant.person.contactDetails.phone               | 0116{RANDOM}                    |
            | applicant.person.contactDetails.mobile              | 07960{RANDOM}                   |
            | applicant.person.contactDetails.email               | applicant.e8.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Morgan Enterprises {RANDOM}     |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Trade Centre           |
            | respondent.organisation.contactDetails.addressLine2 | Southampton                     |
            | respondent.organisation.contactDetails.postcode     | SO1 1AA                         |
            | respondent.organisation.contactDetails.phone        | 0238{RANDOM}                    |
            | respondent.organisation.contactDetails.mobile       | 07970{RANDOM}                   |
            | respondent.organisation.contactDetails.email        | respondent.e8.{RANDOM}@test.com |
            | wordingFields.0.key                                 | account balance                 |
            | wordingFields.0.value                               | {RANDOM}                        |
            | hasOffsiteFee                                       | false                           |
            | caseReference                                       | CASE-E8-{RANDOM}                |
            | accountNumber                                       | ACC-E8-{RANDOM}                 |
            | notes                                               | E8 Person+Org no fee            |
            | lodgementDate                                       | todayiso                        |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Json Body
            """
            {
            "resultCode": "RTC",
            "wordingFields": [
            { "key": "Date", "value": "todayiso" },
            { "key": "Courthouse", "value": "Leeds Combined Court Centre" }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"

        # Entry 9 - Person applicant + Person respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                            |
            | applicationCode                               | EF99001                         |
            | applicant.person.name.title                   | Mr                              |
            | applicant.person.name.surname                 | Nelson {RANDOM}                 |
            | applicant.person.name.firstForename           | George                          |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} North Street           |
            | applicant.person.contactDetails.addressLine2  | Portsmouth                      |
            | applicant.person.contactDetails.postcode      | PO1 1AA                         |
            | applicant.person.contactDetails.phone         | 0239{RANDOM}                    |
            | applicant.person.contactDetails.mobile        | 07980{RANDOM}                   |
            | applicant.person.contactDetails.email         | applicant.e9.{RANDOM}@test.com  |
            | respondent.person.name.title                  | Ms                              |
            | respondent.person.name.surname                | Owen {RANDOM}                   |
            | respondent.person.name.firstForename          | Rachel                          |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} South Road             |
            | respondent.person.contactDetails.addressLine2 | Plymouth                        |
            | respondent.person.contactDetails.postcode     | PL1 1AA                         |
            | respondent.person.contactDetails.phone        | 0175{RANDOM}                    |
            | respondent.person.contactDetails.mobile       | 07990{RANDOM}                   |
            | respondent.person.contactDetails.email        | respondent.e9.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-45y                    |
            | wordingFields.0.key                           | account balance                 |
            | wordingFields.0.value                         | {RANDOM}                        |
            | hasOffsiteFee                                 | false                           |
            | caseReference                                 | CASE-E9-{RANDOM}                |
            | accountNumber                                 | ACC-E9-{RANDOM}                 |
            | notes                                         | E9 Person+Person no fee         |
            | lodgementDate                                 | todayiso                        |
        Then User Verify Response Status Code Should Be "201"

        # Entry 10 - Person applicant + Organisation respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                             |
            | applicationCode                                     | CT99002                          |
            | applicant.person.name.title                         | Mrs                              |
            | applicant.person.name.surname                       | Parker {RANDOM}                  |
            | applicant.person.name.firstForename                 | Diana                            |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} East Road               |
            | applicant.person.contactDetails.addressLine2        | Cambridge                        |
            | applicant.person.contactDetails.postcode            | CB1 1AA                          |
            | applicant.person.contactDetails.phone               | 0122{RANDOM}                     |
            | applicant.person.contactDetails.mobile              | 07110{RANDOM}                    |
            | applicant.person.contactDetails.email               | applicant.e10.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Parker Group {RANDOM}            |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Business Park           |
            | respondent.organisation.contactDetails.addressLine2 | Oxford                           |
            | respondent.organisation.contactDetails.postcode     | OX1 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0186{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07120{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e10.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                        |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | true                             |
            | caseReference                                       | CASE-E10-{RANDOM}                |
            | accountNumber                                       | ACC-E10-{RANDOM}                 |
            | notes                                               | E10 Person+Org with fee          |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # ===========================================================
        # GROUP 2 (E11-E20): Organisation Applicant
        # ===========================================================

        # Entry 11 - Organisation applicant + Person respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                              | null                             |
            | applicationCode                                    | CT99002                          |
            | applicant.organisation.name                        | Alpha Ltd {RANDOM}               |
            | applicant.organisation.contactDetails.addressLine1 | {RANDOM} King Street             |
            | applicant.organisation.contactDetails.addressLine2 | Leeds                            |
            | applicant.organisation.contactDetails.addressLine3 | West Yorkshire                   |
            | applicant.organisation.contactDetails.postcode     | LS1 1AA                          |
            | applicant.organisation.contactDetails.phone        | 0113{RANDOM}                     |
            | applicant.organisation.contactDetails.mobile       | 07130{RANDOM}                    |
            | applicant.organisation.contactDetails.email        | applicant.e11.{RANDOM}@test.com  |
            | respondent.person.name.title                       | Mr                               |
            | respondent.person.name.surname                     | Quinn {RANDOM}                   |
            | respondent.person.name.firstForename               | Patrick                          |
            | respondent.person.contactDetails.addressLine1      | {RANDOM} Market Place            |
            | respondent.person.contactDetails.addressLine2      | York                             |
            | respondent.person.contactDetails.postcode          | YO1 1AA                          |
            | respondent.person.contactDetails.phone             | 0190{RANDOM}                     |
            | respondent.person.contactDetails.mobile            | 07140{RANDOM}                    |
            | respondent.person.contactDetails.email             | respondent.e11.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                      | todayiso-35y                     |
            | wordingFields.0.key                                | Reference                        |
            | wordingFields.0.value                              | {RANDOM}                         |
            | hasOffsiteFee                                      | true                             |
            | caseReference                                      | CASE-E11-{RANDOM}                |
            | accountNumber                                      | ACC-E11-{RANDOM}                 |
            | notes                                              | E11 Org+Person with fee          |
            | lodgementDate                                      | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 12 - Organisation applicant + Person respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                              | null                             |
            | applicationCode                                    | EF99001                          |
            | applicant.organisation.name                        | Beta Solutions {RANDOM}          |
            | applicant.organisation.contactDetails.addressLine1 | {RANDOM} Park Lane               |
            | applicant.organisation.contactDetails.addressLine2 | Manchester                       |
            | applicant.organisation.contactDetails.postcode     | M2 1AA                           |
            | applicant.organisation.contactDetails.phone        | 0161{RANDOM}                     |
            | applicant.organisation.contactDetails.mobile       | 07150{RANDOM}                    |
            | applicant.organisation.contactDetails.email        | applicant.e12.{RANDOM}@test.com  |
            | respondent.person.name.title                       | Mrs                              |
            | respondent.person.name.surname                     | Reed {RANDOM}                    |
            | respondent.person.name.firstForename               | Julia                            |
            | respondent.person.contactDetails.addressLine1      | {RANDOM} Grove Road              |
            | respondent.person.contactDetails.addressLine2      | Sheffield                        |
            | respondent.person.contactDetails.postcode          | S2 1AA                           |
            | respondent.person.contactDetails.phone             | 0114{RANDOM}                     |
            | respondent.person.contactDetails.mobile            | 07160{RANDOM}                    |
            | respondent.person.contactDetails.email             | respondent.e12.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                      | todayiso-27y                     |
            | wordingFields.0.key                                | account balance                  |
            | wordingFields.0.value                              | {RANDOM}                         |
            | hasOffsiteFee                                      | false                            |
            | caseReference                                      | CASE-E12-{RANDOM}                |
            | accountNumber                                      | ACC-E12-{RANDOM}                 |
            | notes                                              | E12 Org+Person no fee            |
            | lodgementDate                                      | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 13 - Organisation applicant + Person respondent, CT99002, no offsite fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                              | null                             |
            | applicationCode                                    | CT99002                          |
            | applicant.organisation.name                        | Gamma Corp {RANDOM}              |
            | applicant.organisation.contactDetails.addressLine1 | {RANDOM} High Road               |
            | applicant.organisation.contactDetails.addressLine2 | Bristol                          |
            | applicant.organisation.contactDetails.postcode     | BS2 1AA                          |
            | applicant.organisation.contactDetails.phone        | 0117{RANDOM}                     |
            | applicant.organisation.contactDetails.mobile       | 07170{RANDOM}                    |
            | applicant.organisation.contactDetails.email        | applicant.e13.{RANDOM}@test.com  |
            | respondent.person.name.title                       | Ms                               |
            | respondent.person.name.surname                     | Scott {RANDOM}                   |
            | respondent.person.name.firstForename               | Claire                           |
            | respondent.person.contactDetails.addressLine1      | {RANDOM} Church Lane             |
            | respondent.person.contactDetails.addressLine2      | Norwich                          |
            | respondent.person.contactDetails.postcode          | NR1 1AA                          |
            | respondent.person.contactDetails.phone             | 0160{RANDOM}                     |
            | respondent.person.contactDetails.mobile            | 07180{RANDOM}                    |
            | respondent.person.contactDetails.email             | respondent.e13.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                      | todayiso-30y                     |
            | wordingFields.0.key                                | Reference                        |
            | wordingFields.0.value                              | {RANDOM}                         |
            | hasOffsiteFee                                      | false                            |
            | caseReference                                      | CASE-E13-{RANDOM}                |
            | accountNumber                                      | ACC-E13-{RANDOM}                 |
            | notes                                              | E13 Org+Person no offsite fee    |
            | lodgementDate                                      | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 14 - Organisation applicant + Organisation respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                             |
            | applicationCode                                     | CT99002                          |
            | applicant.organisation.name                         | Delta Enterprises {RANDOM}       |
            | applicant.organisation.contactDetails.addressLine1  | {RANDOM} Trade Street            |
            | applicant.organisation.contactDetails.addressLine2  | Birmingham                       |
            | applicant.organisation.contactDetails.postcode      | B2 1AA                           |
            | applicant.organisation.contactDetails.phone         | 0121{RANDOM}                     |
            | applicant.organisation.contactDetails.mobile        | 07190{RANDOM}                    |
            | applicant.organisation.contactDetails.email         | applicant.e14.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Echo Holdings {RANDOM}           |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Commerce Road           |
            | respondent.organisation.contactDetails.addressLine2 | Coventry                         |
            | respondent.organisation.contactDetails.postcode     | CV2 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0247{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07210{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e14.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                        |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | true                             |
            | caseReference                                       | CASE-E14-{RANDOM}                |
            | accountNumber                                       | ACC-E14-{RANDOM}                 |
            | notes                                               | E14 Org+Org with fee             |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 15 - Organisation applicant + Organisation respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                             |
            | applicationCode                                     | EF99001                          |
            | applicant.organisation.name                         | Foxtrot Ltd {RANDOM}             |
            | applicant.organisation.contactDetails.addressLine1  | {RANDOM} Brook Street            |
            | applicant.organisation.contactDetails.addressLine2  | Liverpool                        |
            | applicant.organisation.contactDetails.postcode      | L2 1AA                           |
            | applicant.organisation.contactDetails.phone         | 0151{RANDOM}                     |
            | applicant.organisation.contactDetails.mobile        | 07220{RANDOM}                    |
            | applicant.organisation.contactDetails.email         | applicant.e15.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Golf Consulting {RANDOM}         |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Dock Road               |
            | respondent.organisation.contactDetails.addressLine2 | Hull                             |
            | respondent.organisation.contactDetails.postcode     | HU1 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0148{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07230{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e15.{RANDOM}@test.com |
            | wordingFields.0.key                                 | account balance                  |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | false                            |
            | caseReference                                       | CASE-E15-{RANDOM}                |
            | accountNumber                                       | ACC-E15-{RANDOM}                 |
            | notes                                               | E15 Org+Org no fee               |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 16 - Organisation applicant + Organisation respondent, CT99002, no offsite fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                             |
            | applicationCode                                     | CT99002                          |
            | applicant.organisation.name                         | Hotel Group {RANDOM}             |
            | applicant.organisation.contactDetails.addressLine1  | {RANDOM} Harbour Road            |
            | applicant.organisation.contactDetails.addressLine2  | Portsmouth                       |
            | applicant.organisation.contactDetails.postcode      | PO2 1AA                          |
            | applicant.organisation.contactDetails.phone         | 0239{RANDOM}                     |
            | applicant.organisation.contactDetails.mobile        | 07240{RANDOM}                    |
            | applicant.organisation.contactDetails.email         | applicant.e16.{RANDOM}@test.com  |
            | respondent.organisation.name                        | India Services {RANDOM}          |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Marina Way              |
            | respondent.organisation.contactDetails.addressLine2 | Sunderland                       |
            | respondent.organisation.contactDetails.postcode     | SR1 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0191{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07250{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e16.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                        |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | false                            |
            | caseReference                                       | CASE-E16-{RANDOM}                |
            | accountNumber                                       | ACC-E16-{RANDOM}                 |
            | notes                                               | E16 Org+Org no offsite fee       |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 17 - Organisation applicant + Person respondent, CT99002, with fee → result applied
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                              | null                             |
            | applicationCode                                    | CT99002                          |
            | applicant.organisation.name                        | Juliet Industries {RANDOM}       |
            | applicant.organisation.contactDetails.addressLine1 | {RANDOM} Science Park            |
            | applicant.organisation.contactDetails.addressLine2 | Cambridge                        |
            | applicant.organisation.contactDetails.postcode     | CB2 1AA                          |
            | applicant.organisation.contactDetails.phone        | 0122{RANDOM}                     |
            | applicant.organisation.contactDetails.mobile       | 07260{RANDOM}                    |
            | applicant.organisation.contactDetails.email        | applicant.e17.{RANDOM}@test.com  |
            | respondent.person.name.title                       | Mr                               |
            | respondent.person.name.surname                     | Turner {RANDOM}                  |
            | respondent.person.name.firstForename               | Mark                             |
            | respondent.person.contactDetails.addressLine1      | {RANDOM} College Road            |
            | respondent.person.contactDetails.addressLine2      | Oxford                           |
            | respondent.person.contactDetails.postcode          | OX2 1AA                          |
            | respondent.person.contactDetails.phone             | 0186{RANDOM}                     |
            | respondent.person.contactDetails.mobile            | 07270{RANDOM}                    |
            | respondent.person.contactDetails.email             | respondent.e17.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                      | todayiso-38y                     |
            | wordingFields.0.key                                | Reference                        |
            | wordingFields.0.value                              | {RANDOM}                         |
            | hasOffsiteFee                                      | true                             |
            | caseReference                                      | CASE-E17-{RANDOM}                |
            | accountNumber                                      | ACC-E17-{RANDOM}                 |
            | notes                                              | E17 Org+Person with fee          |
            | lodgementDate                                      | todayiso                         |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Json Body
            """
            {
            "resultCode": "RTC",
            "wordingFields": [
            { "key": "Date", "value": "todayiso" },
            { "key": "Courthouse", "value": "Leeds Combined Court Centre" }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"

        # Entry 18 - Organisation applicant + Organisation respondent, EF99001, no fee → result applied
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                             |
            | applicationCode                                     | EF99001                          |
            | applicant.organisation.name                         | Kilo Ventures {RANDOM}           |
            | applicant.organisation.contactDetails.addressLine1  | {RANDOM} Tech Hub                |
            | applicant.organisation.contactDetails.addressLine2  | Edinburgh                        |
            | applicant.organisation.contactDetails.postcode      | EH2 1AA                          |
            | applicant.organisation.contactDetails.phone         | 0131{RANDOM}                     |
            | applicant.organisation.contactDetails.mobile        | 07280{RANDOM}                    |
            | applicant.organisation.contactDetails.email         | applicant.e18.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Lima Partners {RANDOM}           |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Exchange Place          |
            | respondent.organisation.contactDetails.addressLine2 | Glasgow                          |
            | respondent.organisation.contactDetails.postcode     | G1 1AA                           |
            | respondent.organisation.contactDetails.phone        | 0141{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07290{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e18.{RANDOM}@test.com |
            | wordingFields.0.key                                 | account balance                  |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | false                            |
            | caseReference                                       | CASE-E18-{RANDOM}                |
            | accountNumber                                       | ACC-E18-{RANDOM}                 |
            | notes                                               | E18 Org+Org no fee               |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Json Body
            """
            {
            "resultCode": "RTC",
            "wordingFields": [
            { "key": "Date", "value": "todayiso" },
            { "key": "Courthouse", "value": "Leeds Combined Court Centre" }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"

        # Entry 19 - Organisation applicant + Person respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                              | null                             |
            | applicationCode                                    | EF99001                          |
            | applicant.organisation.name                        | Mike & Co {RANDOM}               |
            | applicant.organisation.contactDetails.addressLine1 | {RANDOM} Broad Street            |
            | applicant.organisation.contactDetails.addressLine2 | Wolverhampton                    |
            | applicant.organisation.contactDetails.postcode     | WV1 1AA                          |
            | applicant.organisation.contactDetails.phone        | 0190{RANDOM}                     |
            | applicant.organisation.contactDetails.mobile       | 07310{RANDOM}                    |
            | applicant.organisation.contactDetails.email        | applicant.e19.{RANDOM}@test.com  |
            | respondent.person.name.title                       | Miss                             |
            | respondent.person.name.surname                     | Underwood {RANDOM}               |
            | respondent.person.name.firstForename               | Natalie                          |
            | respondent.person.contactDetails.addressLine1      | {RANDOM} Bridge Street           |
            | respondent.person.contactDetails.addressLine2      | Stoke-on-Trent                   |
            | respondent.person.contactDetails.postcode          | ST1 1AA                          |
            | respondent.person.contactDetails.phone             | 0178{RANDOM}                     |
            | respondent.person.contactDetails.mobile            | 07320{RANDOM}                    |
            | respondent.person.contactDetails.email             | respondent.e19.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                      | todayiso-25y                     |
            | wordingFields.0.key                                | account balance                  |
            | wordingFields.0.value                              | {RANDOM}                         |
            | hasOffsiteFee                                      | false                            |
            | caseReference                                      | CASE-E19-{RANDOM}                |
            | accountNumber                                      | ACC-E19-{RANDOM}                 |
            | notes                                              | E19 Org+Person no fee            |
            | lodgementDate                                      | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 20 - Organisation applicant + Organisation respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                             |
            | applicationCode                                     | CT99002                          |
            | applicant.organisation.name                         | November Group {RANDOM}          |
            | applicant.organisation.contactDetails.addressLine1  | {RANDOM} Castle Street           |
            | applicant.organisation.contactDetails.addressLine2  | Derby                            |
            | applicant.organisation.contactDetails.postcode      | DE1 1AA                          |
            | applicant.organisation.contactDetails.phone         | 0133{RANDOM}                     |
            | applicant.organisation.contactDetails.mobile        | 07330{RANDOM}                    |
            | applicant.organisation.contactDetails.email         | applicant.e20.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Oscar Trading {RANDOM}           |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Friar Gate              |
            | respondent.organisation.contactDetails.addressLine2 | Derby                            |
            | respondent.organisation.contactDetails.postcode     | DE1 2AA                          |
            | respondent.organisation.contactDetails.phone        | 0133{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07340{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e20.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                        |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | true                             |
            | caseReference                                       | CASE-E20-{RANDOM}                |
            | accountNumber                                       | ACC-E20-{RANDOM}                 |
            | notes                                               | E20 Org+Org with fee             |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # ===========================================================
        # GROUP 3 (E21-E30): Standard Applicant APP036
        # ===========================================================

        # Entry 21 - Standard APP036 + Person respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP036                           |
            | applicationCode                               | CT99002                          |
            | respondent.person.name.title                  | Mr                               |
            | respondent.person.name.surname                | Palmer {RANDOM}                  |
            | respondent.person.name.firstForename          | Andrew                           |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Victoria Street         |
            | respondent.person.contactDetails.addressLine2 | Exeter                           |
            | respondent.person.contactDetails.postcode     | EX1 1AA                          |
            | respondent.person.contactDetails.phone        | 0139{RANDOM}                     |
            | respondent.person.contactDetails.mobile       | 07350{RANDOM}                    |
            | respondent.person.contactDetails.email        | respondent.e21.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-42y                     |
            | wordingFields.0.key                           | Reference                        |
            | wordingFields.0.value                         | {RANDOM}                         |
            | hasOffsiteFee                                 | true                             |
            | caseReference                                 | CASE-E21-{RANDOM}                |
            | accountNumber                                 | ACC-E21-{RANDOM}                 |
            | notes                                         | E21 APP036+Person with fee       |
            | lodgementDate                                 | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 22 - Standard APP036 + Person respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP036                           |
            | applicationCode                               | EF99001                          |
            | respondent.person.name.title                  | Mrs                              |
            | respondent.person.name.surname                | Quinn {RANDOM}                   |
            | respondent.person.name.firstForename          | Sandra                           |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Crown Road              |
            | respondent.person.contactDetails.addressLine2 | Gloucester                       |
            | respondent.person.contactDetails.postcode     | GL1 1AA                          |
            | respondent.person.contactDetails.phone        | 0145{RANDOM}                     |
            | respondent.person.contactDetails.mobile       | 07360{RANDOM}                    |
            | respondent.person.contactDetails.email        | respondent.e22.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-33y                     |
            | wordingFields.0.key                           | account balance                  |
            | wordingFields.0.value                         | {RANDOM}                         |
            | hasOffsiteFee                                 | false                            |
            | caseReference                                 | CASE-E22-{RANDOM}                |
            | accountNumber                                 | ACC-E22-{RANDOM}                 |
            | notes                                         | E22 APP036+Person no fee         |
            | lodgementDate                                 | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 23 - Standard APP036 + Person respondent, CT99002, no offsite fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP036                           |
            | applicationCode                               | CT99002                          |
            | respondent.person.name.title                  | Ms                               |
            | respondent.person.name.surname                | Roberts {RANDOM}                 |
            | respondent.person.name.firstForename          | Victoria                         |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Street           |
            | respondent.person.contactDetails.addressLine2 | Swansea                          |
            | respondent.person.contactDetails.postcode     | SA1 1AA                          |
            | respondent.person.contactDetails.phone        | 0179{RANDOM}                     |
            | respondent.person.contactDetails.mobile       | 07370{RANDOM}                    |
            | respondent.person.contactDetails.email        | respondent.e23.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-29y                     |
            | wordingFields.0.key                           | Reference                        |
            | wordingFields.0.value                         | {RANDOM}                         |
            | hasOffsiteFee                                 | false                            |
            | caseReference                                 | CASE-E23-{RANDOM}                |
            | accountNumber                                 | ACC-E23-{RANDOM}                 |
            | notes                                         | E23 APP036+Person no offsite fee |
            | lodgementDate                                 | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 24 - Standard APP036 + Organisation respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP036                           |
            | applicationCode                                     | CT99002                          |
            | respondent.organisation.name                        | Sierra Retail {RANDOM}           |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Retail Park             |
            | respondent.organisation.contactDetails.addressLine2 | Middlesbrough                    |
            | respondent.organisation.contactDetails.postcode     | TS1 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0164{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07380{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e24.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                        |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | true                             |
            | caseReference                                       | CASE-E24-{RANDOM}                |
            | accountNumber                                       | ACC-E24-{RANDOM}                 |
            | notes                                               | E24 APP036+Org with fee          |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 25 - Standard APP036 + Organisation respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP036                           |
            | applicationCode                                     | EF99001                          |
            | respondent.organisation.name                        | Tango Finance {RANDOM}           |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Finance Quarter         |
            | respondent.organisation.contactDetails.addressLine2 | Cardiff                          |
            | respondent.organisation.contactDetails.postcode     | CF2 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0292{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07390{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e25.{RANDOM}@test.com |
            | wordingFields.0.key                                 | account balance                  |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | false                            |
            | caseReference                                       | CASE-E25-{RANDOM}                |
            | accountNumber                                       | ACC-E25-{RANDOM}                 |
            | notes                                               | E25 APP036+Org no fee            |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 26 - Standard APP036 + Organisation respondent, CT99002, no offsite fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP036                           |
            | applicationCode                                     | CT99002                          |
            | respondent.organisation.name                        | Uniform Trading {RANDOM}         |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Quay Street             |
            | respondent.organisation.contactDetails.addressLine2 | Southampton                      |
            | respondent.organisation.contactDetails.postcode     | SO2 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0238{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07410{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e26.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                        |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | false                            |
            | caseReference                                       | CASE-E26-{RANDOM}                |
            | accountNumber                                       | ACC-E26-{RANDOM}                 |
            | notes                                               | E26 APP036+Org no offsite fee    |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 27 - Standard APP036 + Person respondent, CT99002, with fee → result applied
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP036                           |
            | applicationCode                               | CT99002                          |
            | respondent.person.name.title                  | Mr                               |
            | respondent.person.name.surname                | Victor {RANDOM}                  |
            | respondent.person.name.firstForename          | Kenneth                          |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Union Street            |
            | respondent.person.contactDetails.addressLine2 | Aberdeen                         |
            | respondent.person.contactDetails.postcode     | AB1 1AA                          |
            | respondent.person.contactDetails.phone        | 0122{RANDOM}                     |
            | respondent.person.contactDetails.mobile       | 07420{RANDOM}                    |
            | respondent.person.contactDetails.email        | respondent.e27.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-50y                     |
            | wordingFields.0.key                           | Reference                        |
            | wordingFields.0.value                         | {RANDOM}                         |
            | hasOffsiteFee                                 | true                             |
            | caseReference                                 | CASE-E27-{RANDOM}                |
            | accountNumber                                 | ACC-E27-{RANDOM}                 |
            | notes                                         | E27 APP036+Person with fee       |
            | lodgementDate                                 | todayiso                         |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Json Body
            """
            {
            "resultCode": "RTC",
            "wordingFields": [
            { "key": "Date", "value": "todayiso" },
            { "key": "Courthouse", "value": "Leeds Combined Court Centre" }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"

        # Entry 28 - Standard APP036 + Organisation respondent, EF99001, no fee → result applied
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP036                           |
            | applicationCode                                     | EF99001                          |
            | respondent.organisation.name                        | Whiskey Wholesale {RANDOM}       |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Depot Road              |
            | respondent.organisation.contactDetails.addressLine2 | Dundee                           |
            | respondent.organisation.contactDetails.postcode     | DD1 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0138{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07430{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e28.{RANDOM}@test.com |
            | wordingFields.0.key                                 | account balance                  |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | false                            |
            | caseReference                                       | CASE-E28-{RANDOM}                |
            | accountNumber                                       | ACC-E28-{RANDOM}                 |
            | notes                                               | E28 APP036+Org no fee            |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Json Body
            """
            {
            "resultCode": "RTC",
            "wordingFields": [
            { "key": "Date", "value": "todayiso" },
            { "key": "Courthouse", "value": "Leeds Combined Court Centre" }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"

        # Entry 29 - Standard APP036 + Person respondent, CT99002, no offsite fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP036                           |
            | applicationCode                               | CT99002                          |
            | respondent.person.name.title                  | Ms                               |
            | respondent.person.name.surname                | Xander {RANDOM}                  |
            | respondent.person.name.firstForename          | Lesley                           |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Fore Street             |
            | respondent.person.contactDetails.addressLine2 | Truro                            |
            | respondent.person.contactDetails.postcode     | TR1 1AA                          |
            | respondent.person.contactDetails.phone        | 0187{RANDOM}                     |
            | respondent.person.contactDetails.mobile       | 07440{RANDOM}                    |
            | respondent.person.contactDetails.email        | respondent.e29.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-36y                     |
            | wordingFields.0.key                           | Reference                        |
            | wordingFields.0.value                         | {RANDOM}                         |
            | hasOffsiteFee                                 | false                            |
            | caseReference                                 | CASE-E29-{RANDOM}                |
            | accountNumber                                 | ACC-E29-{RANDOM}                 |
            | notes                                         | E29 APP036+Person no offsite fee |
            | lodgementDate                                 | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 30 - Standard APP036 + Organisation respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP036                           |
            | applicationCode                                     | CT99002                          |
            | respondent.organisation.name                        | Yankee Commerce {RANDOM}         |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Commercial Road         |
            | respondent.organisation.contactDetails.addressLine2 | Reading                          |
            | respondent.organisation.contactDetails.postcode     | RG1 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0118{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07450{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e30.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                        |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | true                             |
            | caseReference                                       | CASE-E30-{RANDOM}                |
            | accountNumber                                       | ACC-E30-{RANDOM}                 |
            | notes                                               | E30 APP036+Org with fee          |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # ===========================================================
        # GROUP 4 (E31-E40): Standard Applicant APP013
        # ===========================================================

        # Entry 31 - Standard APP013 + Person respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP013                           |
            | applicationCode                               | CT99002                          |
            | respondent.person.name.title                  | Mr                               |
            | respondent.person.name.surname                | Zane {RANDOM}                    |
            | respondent.person.name.firstForename          | David                            |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Regent Street           |
            | respondent.person.contactDetails.addressLine2 | London                           |
            | respondent.person.contactDetails.postcode     | W1B 5AA                          |
            | respondent.person.contactDetails.phone        | 0207{RANDOM}                     |
            | respondent.person.contactDetails.mobile       | 07460{RANDOM}                    |
            | respondent.person.contactDetails.email        | respondent.e31.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-44y                     |
            | wordingFields.0.key                           | Reference                        |
            | wordingFields.0.value                         | {RANDOM}                         |
            | hasOffsiteFee                                 | true                             |
            | caseReference                                 | CASE-E31-{RANDOM}                |
            | accountNumber                                 | ACC-E31-{RANDOM}                 |
            | notes                                         | E31 APP013+Person with fee       |
            | lodgementDate                                 | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 32 - Standard APP013 + Person respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP013                           |
            | applicationCode                               | EF99001                          |
            | respondent.person.name.title                  | Mrs                              |
            | respondent.person.name.surname                | Abbott {RANDOM}                  |
            | respondent.person.name.firstForename          | Claire                           |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Bond Street             |
            | respondent.person.contactDetails.addressLine2 | London                           |
            | respondent.person.contactDetails.postcode     | W1S 1AA                          |
            | respondent.person.contactDetails.phone        | 0207{RANDOM}                     |
            | respondent.person.contactDetails.mobile       | 07470{RANDOM}                    |
            | respondent.person.contactDetails.email        | respondent.e32.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-31y                     |
            | wordingFields.0.key                           | account balance                  |
            | wordingFields.0.value                         | {RANDOM}                         |
            | hasOffsiteFee                                 | false                            |
            | caseReference                                 | CASE-E32-{RANDOM}                |
            | accountNumber                                 | ACC-E32-{RANDOM}                 |
            | notes                                         | E32 APP013+Person no fee         |
            | lodgementDate                                 | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 33 - Standard APP013 + Person respondent, CT99002, no offsite fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP013                           |
            | applicationCode                               | CT99002                          |
            | respondent.person.name.title                  | Mr                               |
            | respondent.person.name.surname                | Barker {RANDOM}                  |
            | respondent.person.name.firstForename          | Steven                           |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Fleet Street            |
            | respondent.person.contactDetails.addressLine2 | London                           |
            | respondent.person.contactDetails.postcode     | EC4Y 1AA                         |
            | respondent.person.contactDetails.phone        | 0207{RANDOM}                     |
            | respondent.person.contactDetails.mobile       | 07480{RANDOM}                    |
            | respondent.person.contactDetails.email        | respondent.e33.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-26y                     |
            | wordingFields.0.key                           | Reference                        |
            | wordingFields.0.value                         | {RANDOM}                         |
            | hasOffsiteFee                                 | false                            |
            | caseReference                                 | CASE-E33-{RANDOM}                |
            | accountNumber                                 | ACC-E33-{RANDOM}                 |
            | notes                                         | E33 APP013+Person no offsite fee |
            | lodgementDate                                 | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 34 - Standard APP013 + Organisation respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP013                           |
            | applicationCode                                     | CT99002                          |
            | respondent.organisation.name                        | Copper Alloys {RANDOM}           |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Canal Street            |
            | respondent.organisation.contactDetails.addressLine2 | Nottingham                       |
            | respondent.organisation.contactDetails.postcode     | NG1 2AA                          |
            | respondent.organisation.contactDetails.phone        | 0115{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07490{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e34.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                        |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | true                             |
            | caseReference                                       | CASE-E34-{RANDOM}                |
            | accountNumber                                       | ACC-E34-{RANDOM}                 |
            | notes                                               | E34 APP013+Org with fee          |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 35 - Standard APP013 + Organisation respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP013                           |
            | applicationCode                                     | EF99001                          |
            | respondent.organisation.name                        | Diamond Logistics {RANDOM}       |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Warehouse Way           |
            | respondent.organisation.contactDetails.addressLine2 | Leicester                        |
            | respondent.organisation.contactDetails.postcode     | LE2 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0116{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07510{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e35.{RANDOM}@test.com |
            | wordingFields.0.key                                 | account balance                  |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | false                            |
            | caseReference                                       | CASE-E35-{RANDOM}                |
            | accountNumber                                       | ACC-E35-{RANDOM}                 |
            | notes                                               | E35 APP013+Org no fee            |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 36 - Standard APP013 + Organisation respondent, CT99002, no offsite fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP013                           |
            | applicationCode                                     | CT99002                          |
            | respondent.organisation.name                        | Emerald Imports {RANDOM}         |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Port Road               |
            | respondent.organisation.contactDetails.addressLine2 | Felixstowe                       |
            | respondent.organisation.contactDetails.postcode     | IP11 1AA                         |
            | respondent.organisation.contactDetails.phone        | 0394{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07520{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e36.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                        |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | false                            |
            | caseReference                                       | CASE-E36-{RANDOM}                |
            | accountNumber                                       | ACC-E36-{RANDOM}                 |
            | notes                                               | E36 APP013+Org no offsite fee    |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 37 - Standard APP013 + Person respondent, CT99002, with fee → result applied
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP013                           |
            | applicationCode                               | CT99002                          |
            | respondent.person.name.title                  | Mr                               |
            | respondent.person.name.surname                | Fraser {RANDOM}                  |
            | respondent.person.name.firstForename          | Callum                           |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Rose Street             |
            | respondent.person.contactDetails.addressLine2 | Edinburgh                        |
            | respondent.person.contactDetails.postcode     | EH3 1AA                          |
            | respondent.person.contactDetails.phone        | 0131{RANDOM}                     |
            | respondent.person.contactDetails.mobile       | 07530{RANDOM}                    |
            | respondent.person.contactDetails.email        | respondent.e37.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-39y                     |
            | wordingFields.0.key                           | Reference                        |
            | wordingFields.0.value                         | {RANDOM}                         |
            | hasOffsiteFee                                 | true                             |
            | caseReference                                 | CASE-E37-{RANDOM}                |
            | accountNumber                                 | ACC-E37-{RANDOM}                 |
            | notes                                         | E37 APP013+Person with fee       |
            | lodgementDate                                 | todayiso                         |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Json Body
            """
            {
            "resultCode": "RTC",
            "wordingFields": [
            { "key": "Date", "value": "todayiso" },
            { "key": "Courthouse", "value": "Leeds Combined Court Centre" }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"

        # Entry 38 - Standard APP013 + Organisation respondent, EF99001, no fee → result applied
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP013                           |
            | applicationCode                                     | EF99001                          |
            | respondent.organisation.name                        | Granite Works {RANDOM}           |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Quarry Road             |
            | respondent.organisation.contactDetails.addressLine2 | Aberdeen                         |
            | respondent.organisation.contactDetails.postcode     | AB2 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0122{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07540{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e38.{RANDOM}@test.com |
            | wordingFields.0.key                                 | account balance                  |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | false                            |
            | caseReference                                       | CASE-E38-{RANDOM}                |
            | accountNumber                                       | ACC-E38-{RANDOM}                 |
            | notes                                               | E38 APP013+Org no fee            |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Json Body
            """
            {
            "resultCode": "RTC",
            "wordingFields": [
            { "key": "Date", "value": "todayiso" },
            { "key": "Courthouse", "value": "Leeds Combined Court Centre" }
            ]
            }
            """
        Then User Verify Response Status Code Should Be "201"

        # Entry 39 - Standard APP013 + Person respondent, EF99001, no fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP013                           |
            | applicationCode                               | EF99001                          |
            | respondent.person.name.title                  | Mrs                              |
            | respondent.person.name.surname                | Hamilton {RANDOM}                |
            | respondent.person.name.firstForename          | Moira                            |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Castle Terrace          |
            | respondent.person.contactDetails.addressLine2 | Edinburgh                        |
            | respondent.person.contactDetails.postcode     | EH4 1AA                          |
            | respondent.person.contactDetails.phone        | 0131{RANDOM}                     |
            | respondent.person.contactDetails.mobile       | 07550{RANDOM}                    |
            | respondent.person.contactDetails.email        | respondent.e39.{RANDOM}@test.com |
            | respondent.person.dateOfBirth                 | todayiso-48y                     |
            | wordingFields.0.key                           | account balance                  |
            | wordingFields.0.value                         | {RANDOM}                         |
            | hasOffsiteFee                                 | false                            |
            | caseReference                                 | CASE-E39-{RANDOM}                |
            | accountNumber                                 | ACC-E39-{RANDOM}                 |
            | notes                                         | E39 APP013+Person no fee         |
            | lodgementDate                                 | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # Entry 40 - Standard APP013 + Organisation respondent, CT99002, with fee
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP013                           |
            | applicationCode                                     | CT99002                          |
            | respondent.organisation.name                        | Ivory Tower {RANDOM}             |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} University Road         |
            | respondent.organisation.contactDetails.addressLine2 | Durham                           |
            | respondent.organisation.contactDetails.postcode     | DH1 1AA                          |
            | respondent.organisation.contactDetails.phone        | 0191{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07560{RANDOM}                    |
            | respondent.organisation.contactDetails.email        | respondent.e40.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Reference                        |
            | wordingFields.0.value                               | {RANDOM}                         |
            | hasOffsiteFee                                       | true                             |
            | caseReference                                       | CASE-E40-{RANDOM}                |
            | accountNumber                                       | ACC-E40-{RANDOM}                 |
            | notes                                               | E40 APP013+Org with fee          |
            | lodgementDate                                       | todayiso                         |
        Then User Verify Response Status Code Should Be "201"

        # ===========================================================
        # SORT by applicantName
        # The full sorted response body is printed in the Cypress log by ApiGetHelper.
        # Person applicant name = firstForename + surname (e.g. "Daniel Evans")
        # Org applicant name    = organisation.name     (e.g. "Alpha Ltd")
        # Standard applicant    = standardApplicant code (e.g. "APP036")
        # ===========================================================

        # Sort applicantName ascending - full sorted list printed in log
        When User Makes GET API Request To "/application-lists/:listId/entries?sort=applicantName,asc&pageSize=40"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | totalElements | 40 |

        # Sort applicantName descending - full sorted list printed in log
        When User Makes GET API Request To "/application-lists/:listId/entries?sort=applicantName,desc&pageSize=40"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | totalElements | 40 |
