Feature: Application List Entries Print

    @regression @applicationsList @ARCPOC-214 @ARCPOC-453 @ARCPOC-449 @ARPCPOC-1294
    Scenario Outline: Application List - Print Selected Entries - Print Page and Print Continuous
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Entry 1 - Person applicant + Person respondent (CT99002)
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                                |
            | applicationCode                               | AP99001                             |
            | applicant.person.name.title                   | Mr                                  |
            | applicant.person.name.lastName                | Taylor {SCENARIO_ID}                |
            | applicant.person.name.firstName               | Henry                               |
            | applicant.person.name.middleName              | James                               |
            | applicant.person.contactDetails.addressLine1  | {SCENARIO_ID} King Street           |
            | applicant.person.contactDetails.addressLine2  | Westminster                         |
            | applicant.person.contactDetails.addressLine3  | London                              |
            | applicant.person.contactDetails.addressLine4  | Greater London                      |
            | applicant.person.contactDetails.addressLine5  | United Kingdom                      |
            | applicant.person.contactDetails.postcode      | SW1A 1AA                            |
            | applicant.person.contactDetails.phone         | 0203{RANDOM}                        |
            | applicant.person.contactDetails.mobile        | 07123{RANDOM}                       |
            | applicant.person.contactDetails.email         | applicant{SCENARIO_ID}@example.com  |
            | respondent.person.name.title                  | Ms                                  |
            | respondent.person.name.lastName               | Clark {SCENARIO_ID}                 |
            | respondent.person.name.firstName              | Emily                               |
            | respondent.person.name.middleName             | Rose                                |
            | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Road           |
            | respondent.person.contactDetails.addressLine2 | Bristol                             |
            | respondent.person.contactDetails.addressLine3 | Avon                                |
            | respondent.person.contactDetails.addressLine4 | United Kingdom                      |
            | respondent.person.contactDetails.postcode     | BS15 5AA                            |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                        |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                       |
            | respondent.person.contactDetails.email        | respondent{SCENARIO_ID}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-25y                        |
            | wordingFields.0.key                           | Date of Hearing                     |
            | wordingFields.0.value                         | "{SCENARIO_ID}"                     |
            | hasOffsiteFee                                 | true                                |
            | caseReference                                 | CASE-{RANDOM}                       |
            | accountNumber                                 | ACC-E1-{RANDOM}                     |
            | notes                                         | Case noted with ref {SCENARIO_ID}   |
            | lodgementDate                                 | todayiso                            |
            | officials.0.title                             | Mr                                  |
            | officials.0.surname                           | Turner {SCENARIO_ID}                |
            | officials.0.forename                          | Graham                              |
            | officials.0.type                              | MAGISTRATE                          |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId1/results" With Json Body
            """
            {
                "resultCode": "AUTH"
            }
            """
        Then User Verify Response Status Code Should Be "201"
        # Entry 2 - Person applicant + Organisation respondent (EF99001)
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                                |
            | applicationCode                                     | EF99001                             |
            | applicant.person.name.title                         | Mrs                                 |
            | applicant.person.name.lastName                      | Johnson {SCENARIO_ID}               |
            | applicant.person.name.firstName                     | Sarah                               |
            | applicant.person.name.middleName                    | Louise                              |
            | applicant.person.contactDetails.addressLine1        | {SCENARIO_ID} High Street           |
            | applicant.person.contactDetails.addressLine2        | Manchester                          |
            | applicant.person.contactDetails.addressLine3        | Greater Manchester                  |
            | applicant.person.contactDetails.postcode            | M1 1AA                              |
            | applicant.person.contactDetails.phone               | 0161{RANDOM}                        |
            | applicant.person.contactDetails.mobile              | 07700{RANDOM}                       |
            | applicant.person.contactDetails.email               | applicant{SCENARIO_ID}@example.com  |
            | respondent.organisation.name                        | Greenfield Consulting {SCENARIO_ID} |
            | respondent.organisation.contactDetails.addressLine1 | {SCENARIO_ID} Park Lane             |
            | respondent.organisation.contactDetails.addressLine2 | Birmingham                          |
            | respondent.organisation.contactDetails.addressLine3 | West Midlands                       |
            | respondent.organisation.contactDetails.postcode     | B1 1AA                              |
            | respondent.organisation.contactDetails.phone        | 0121{RANDOM}                        |
            | respondent.organisation.contactDetails.mobile       | 07800{RANDOM}                       |
            | wordingFields.0.key                                 | account balance                     |
            | wordingFields.0.value                               | {SCENARIO_ID}                       |
            | hasOffsiteFee                                       | false                               |
            | caseReference                                       | CASE-{RANDOM}                       |
            | accountNumber                                       | ACC-E2-{RANDOM}                     |
            | notes                                               | Case noted with ref {SCENARIO_ID}   |
            | lodgementDate                                       | todayiso                            |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId2"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId2/results" With Json Body
            """
            {
                "resultCode": "AUTH"
            }
            """
        Then User Verify Response Status Code Should Be "201"
        # Entry 3 - Standard applicant APP036 + Person respondent
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | BGAS                                |
            | applicationCode                               | AP99001                             |
            | respondent.person.name.title                  | Mr                                  |
            | respondent.person.name.lastName               | Davies {SCENARIO_ID}                |
            | respondent.person.name.firstName              | Owen                                |
            | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Castle Road           |
            | respondent.person.contactDetails.addressLine2 | Leeds                               |
            | respondent.person.contactDetails.addressLine3 | West Yorkshire                      |
            | respondent.person.contactDetails.postcode     | LS1 1AA                             |
            | respondent.person.contactDetails.phone        | 0113{RANDOM}                        |
            | respondent.person.contactDetails.mobile       | 07500{RANDOM}                       |
            | respondent.person.contactDetails.email        | respondent{SCENARIO_ID}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-35y                        |
            | wordingFields.0.key                           | Date of Hearing                     |
            | wordingFields.0.value                         | "{SCENARIO_ID}"                     |
            | hasOffsiteFee                                 | false                               |
            | caseReference                                 | CASE-{RANDOM}                       |
            | accountNumber                                 | ACC-E3-{RANDOM}                     |
            | notes                                         | Case noted with ref {SCENARIO_ID}   |
            | lodgementDate                                 | todayiso                            |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId3"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId3/results" With Json Body
            """
            {
                "resultCode": "AUTH"
            }
            """
        Then User Verify Response Status Code Should Be "201"
        Given User Has No Downloaded PDFs
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description | CourtSearch         | Court   | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      |             | <courtLocationCode> | <Court> |        |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Should See The Button "Actions" Is Disabled
        # Select all entries
        When User Checks The Select All Checkbox In Table "Entries"
        Then User Should See The Button "Actions" Is Enabled
        # Print continuous
        When User Clicks "Actions" Then "Print continuous" From Caption Menu In Table "Entries"
        Then User Verifies PDF "<PDFNameContinuous>" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Has <Pages> Pages
        Then User Verifies Latest Downloaded PDF Contains Text "Check List Report"
        Then User Verifies Latest Downloaded PDF Contains <Entries> "Applicant" Entries
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Date & Time            | <DisplayDate> <Time>                         |
            | Duration               | -                                            |
            | Location               | <Court>                                      |
            | Applicant              | Mr Henry James Taylor {SCENARIO_ID}          |
            | Respondent             | Ms Emily Rose Clark {SCENARIO_ID}            |
            | Application Code       | AP99001                                      |
            | Application Title      | Appeal to Crown Court                        |
            | Result                 | Authorised                                   |
            | Notes                  | Case noted with ref {SCENARIO_ID}            |
            | Account Reference      | ACC-E1-{RANDOM}                              |
            | Case Reference         | CASE-{RANDOM}                                |
            | This matter was before | Mr Turner {SCENARIO_ID} Graham MAGISTRATE    |
            | Applicant              | Mrs Sarah Louise Johnson {SCENARIO_ID}       |
            | Respondent             | Greenfield Consulting {SCENARIO_ID}          |
            | Application Code       | EF99001                                      |
            | Application Title      | Collection Order - Financial Penalty Account |
            | Result                 | Authorised                                   |
            | This matter was before | -                                            |
            | Applicant              | Innovative Solutions Inc                     |
            | Respondent             | Mr Owen Davies {SCENARIO_ID}                 |
            | Application Code       | AP99001                                      |
            | Application Title      | Appeal to Crown Court                        |
            | Result                 | Authorised                                   |
            | This matter was before | -                                            |
        Then User Clears Downloaded PDFs
        # Print page
        When User Clicks "Actions" Then "Print page" From Caption Menu In Table "Entries"
        Then User Verifies PDF "<PDFNamePage>" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Has <Pages> Pages
        Then User Verifies Latest Downloaded PDF Contains Text "<Court>"
        Then User Verifies Latest Downloaded PDF Contains Text "Authorised"
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Application brought by | Mr Henry James Taylor {SCENARIO_ID}          |
            | Respondent             | Ms Emily Rose Clark {SCENARIO_ID}            |
            | Matter considered      | Appeal to Crown Court                        |
            | This matter was before | Mr Turner {SCENARIO_ID} Graham MAGISTRATE    |
            | Dated                  | <DisplayDateLong>                            |
            | Produced on            | <DisplayDate>                                |
            | Application brought by | Mrs Sarah Louise Johnson {SCENARIO_ID}       |
            | Respondent             | Greenfield Consulting {SCENARIO_ID}          |
            | Matter considered      | Collection Order - Financial Penalty Account |
            | This matter was before | -                                            |
            | Dated                  | <DisplayDateLong>                            |
            | Produced on            | <DisplayDate>                                |
            | Application brought by | British Gas Trading Limited                  |
            | Respondent             | Mr Owen Davies {SCENARIO_ID}                 |
            | Matter considered      | Appeal to Crown Court                        |
            | This matter was before | -                                            |
            | Dated                  | <DisplayDateLong>                            |
            | Produced on            | <DisplayDate>                                |
        Then User Clears Downloaded PDFs
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | Status | Description                                  | courtLocationCode | SearchDate | DisplayDate  | DisplayDateLong  | Entries | Court                     | Pages | PDFNameContinuous                             | PDFNamePage                                   |
            | user2 | todayiso | timenowhhmm-3h | OPEN   | Applications to review at Test_{SCENARIO_ID} | BCC026            | today      | todayDisplay | todaydisplaylong | 3       | Bristol Crown Court Set 3 | 3     | bristol-crown-court-set-3-todayiso-print-cont | bristol-crown-court-set-3-todayiso-print-page |
