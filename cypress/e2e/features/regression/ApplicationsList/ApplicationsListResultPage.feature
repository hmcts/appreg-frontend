Feature: Applications List Result

    @regression @applicationsList @ARCPOC-965 @ARCPOC-1072 @ARCPOC-1267
    Scenario Outline: Application List - Result Selected - Person Applicant and Respondent
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
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
            | respondent.person.contactDetails.postcode     | BS15 5AA                       |
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
        Then User Should See The Button "Result selected" Is Disabled
        When User Checks The Checkbox In Row Of Table "Lists" With:
            | Sequence number | Account number | Applicant                        | Respondent                     | Post code | Title                                          | Fee req | Resulted |
            | 1               | ACC-{RANDOM}   | Mr, Henry James, Taylor {RANDOM} | Ms, Emily Rose, Clark {RANDOM} | BS15 5AA  | Issue of liability order summons - council tax | No      |          |
        Then User Should See The Button "Result selected" Is Enabled
        When User Clicks On The "Result selected" Button
        Then User See "Result applications" On The Page
        Then User Should See Row In Table "Application(s) to result" With Values:
            | Sequence number | Applicant(s)                     | Respondent(s)                  | Application Title(s)                           |
            | 1               | Mr, Henry James, Taylor {RANDOM} | Ms, Emily Rose, Clark {RANDOM} | Issue of liability order summons - council tax |
        Then User Selects "RTC - Refer to Court" From The Textbox "Result code" Autocomplete By Typing "RTC"
        Then User Should See Summary Card With Title "RTC - Refer to Court"
        Then User Should See Tag "Pending" In Summary Card "RTC - Refer to Court"
        Then User Should See The Link "Remove" In Summary Card "RTC - Refer to Court"
        Then User Should See "Wording" In Summary Card "RTC - Refer to Court"
        Then User Should See "Referred for full court hearing on" In Summary Card "RTC - Refer to Court"
        When User Clicks On The "Save changes" Button
        Then User Sees Validation Error Banner "There is a problem Enter a Date in the result wording section Enter a Courthouse in the result wording section"
        Then User Verifies The "RTC - Refer to Court" Summary Card Has Textbox With Placeholder "Enter a Date" And Enters "01/04/2026"
        When User Clicks On The "Save changes" Button
        Then User Sees Validation Error Banner "There is a problem Enter a Courthouse in the result wording section"
        Then User Verifies The "RTC - Refer to Court" Summary Card Has Textbox With Placeholder "Enter a Courthouse" And Enters "Bristol Crown Court"
        When User Clicks On The "Save changes" Button
        Then User Should See Tag "Existing" In Summary Card "RTC - Refer to Court"
        Then User Sees Success Banner "Result codes applied successfully"
        Then User Clicks The Link "Remove" In Summary Card "RTC - Refer to Court"
        Then User Sees Success Banner "Results removed The results have been removed from these application list entries."
        Then User Selects "AUTH - Authorised" From The Textbox "Result code" Autocomplete By Typing "AUTH"
        Then User Should See Summary Card With Title "AUTH - Authorised"
        When User Clicks On The "Save changes" Button
        Then User Sees Success Banner "Result codes applied successfully"
        Then User Should See Tag "Existing" In Summary Card "AUTH - Authorised"
        Then User Selects "APPC - Appeal to Crown Court" From The Textbox "Result code" Autocomplete By Typing "APPC"
        Then User Should See Summary Card With Title "APPC - Appeal to Crown Court"
        Then User Verifies The "APPC - Appeal to Crown Court" Summary Card Has Textbox With Placeholder "Enter a Name of Crown Court" And Enters "Bristol Crown Court"
        When User Clicks On The "Save changes" Button
        Then User Sees Success Banner "Result codes applied successfully"
        Then User Should See Tag "Existing" In Summary Card "APPC - Appeal to Crown Court"
        Then User Clicks On The Breadcrumb Link "Applications list details"
        Then User Should See Row In Table "Lists" With Values:
            | Sequence number | Account number | Applicant                        | Respondent                     | Post code | Title                                          | Fee req | Resulted   |
            | 1               | ACC-{RANDOM}   | Mr, Henry James, Taylor {RANDOM} | Ms, Emily Rose, Clark {RANDOM} | BS15 5AA  | Issue of liability order summons - council tax | No      | AUTH, APPC |
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | SearchDate | APIDate  | DisplayDate  | Time           | courtLocationCode | Court                     | Description                             | Entries | Status |
            | user2 | today      | todayiso | todaydisplay | timenowhhmm-3h | BCC026            | Bristol Crown Court Set 3 | Applications to review at Test_{RANDOM} | 1       | OPEN   |

    @regression @applicationsList @ARCPOC-965 @ARCPOC-1072 @ARCPOC-1267
    Scenario Outline: Application List - Result Selected - Organisation Applicant and Respondent
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                          |
            | applicationCode                                     | CT99002                       |
            | applicant.organisation.name                         | Test Acme Industries {RANDOM} |
            | applicant.organisation.contactDetails.addressLine1  | {RANDOM} King Street          |
            | applicant.organisation.contactDetails.addressLine2  | Westminster                   |
            | applicant.organisation.contactDetails.addressLine3  | London                        |
            | applicant.organisation.contactDetails.addressLine4  | Greater London                |
            | applicant.organisation.contactDetails.addressLine5  | United Kingdom                |
            | applicant.organisation.contactDetails.postcode      | SW1A 1AA                      |
            | applicant.organisation.contactDetails.phone         | 0203{RANDOM}                  |
            | applicant.organisation.contactDetails.mobile        | 07123{RANDOM}                 |
            | applicant.organisation.contactDetails.email         | {RANDOM}@example.com          |
            | respondent.organisation.name                        | Test Respondent Ltd {RANDOM}  |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Market Road          |
            | respondent.organisation.contactDetails.addressLine2 | Bristol                       |
            | respondent.organisation.contactDetails.addressLine3 | Avon                          |
            | respondent.organisation.contactDetails.addressLine4 | United Kingdom                |
            | respondent.organisation.contactDetails.postcode     | BS15 5AA                      |
            | respondent.organisation.contactDetails.phone        | 0117{RANDOM}                  |
            | respondent.organisation.contactDetails.mobile       | 07984{RANDOM}                 |
            | wordingFields.0.key                                 | Reference                     |
            | wordingFields.0.value                               | {RANDOM}                      |
            | hasOffsiteFee                                       | true                          |
            | caseReference                                       | CASE-{RANDOM}                 |
            | notes                                               | Case noted with ref {RANDOM}  |
            | lodgementDate                                       | todayiso                      |
            | officials.0.title                                   | Mr                            |
            | officials.0.surname                                 | Turner {RANDOM}               |
            | officials.0.forename                                | Graham                        |
            | officials.0.type                                    | MAGISTRATE                    |
        Then User Verify Response Status Code Should Be "201"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                         |
            | applicationCode                               | EF99001                      |
            | applicant.person.name.title                   | Mr                           |
            | applicant.person.name.surname                 | Taylor {RANDOM}              |
            | applicant.person.name.firstForename           | Henry                        |
            | applicant.person.name.secondForename          | James                        |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street         |
            | applicant.person.contactDetails.addressLine2  | Westminster                  |
            | applicant.person.contactDetails.addressLine3  | London                       |
            | applicant.person.contactDetails.addressLine4  | Greater London               |
            | applicant.person.contactDetails.addressLine5  | United Kingdom               |
            | applicant.person.contactDetails.postcode      | SW1A 1AA                     |
            | applicant.person.contactDetails.phone         | 0203{RANDOM}                 |
            | applicant.person.contactDetails.mobile        | 07123{RANDOM}                |
            | applicant.person.contactDetails.email         | {RANDOM}@example.com         |
            | respondent.person.name.title                  | Ms                           |
            | respondent.person.name.surname                | Clark {RANDOM}               |
            | respondent.person.name.firstForename          | Emily                        |
            | respondent.person.name.secondForename         | Rose                         |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road         |
            | respondent.person.contactDetails.addressLine2 | Bristol                      |
            | respondent.person.contactDetails.addressLine3 | Avon                         |
            | respondent.person.contactDetails.addressLine4 | United Kingdom               |
            | respondent.person.contactDetails.postcode     | BS15 5AA                     |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                 |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                |
            | respondent.person.contactDetails.email        | {RANDOM}@example.com         |
            | respondent.dateOfBirth                        | todayiso-25y                 |
            | wordingFields.0.key                           | account balance              |
            | wordingFields.0.value                         | {RANDOM}                     |
            | hasOffsiteFee                                 | true                         |
            | caseReference                                 | CASE-{RANDOM}                |
            | accountNumber                                 | ACC-{RANDOM}                 |
            | notes                                         | Case noted with ref {RANDOM} |
            | lodgementDate                                 | todayiso                     |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Json Body
            """
            {
            "resultCode": "RTC",
            "wordingFields": [
            {
            "key": "Date",
            "value": "24-02-2026"
            },
            {
            "key": "Courthouse",
            "value": "London Courthouse"
            }
            ]
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
        Then User Should See The Button "Result selected" Is Disabled
        When User Checks The Select All Checkbox In Table "Lists"
        Then User Should See The Button "Result selected" Is Enabled
        When User Clicks On The "Result selected" Button
        Then User See "Result applications" On The Page
        Then User Should See Row In Table "Application(s) to result" With Values:
            | Sequence number | Applicant(s)                     | Respondent(s)                  | Application Title(s)                           |
            | 1               | Test Acme Industries {RANDOM}    | Test Respondent Ltd {RANDOM}   | Issue of liability order summons - council tax |
            | 2               | Mr, Henry James, Taylor {RANDOM} | Ms, Emily Rose, Clark {RANDOM} | Collection Order - Financial Penalty Account   |
        Then User Selects "PROA - Production Order (to allow access)" From The Textbox "Result code" Autocomplete By Typing "PROA"
        Then User Should See Summary Card With Title "PROA - Production Order (to allow access)"
        Then User Should See Tag "Pending" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See The Link "Remove" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See "Wording" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See "Production Order made for access to be allowed to material within" In Summary Card "PROA - Production Order (to allow access)"
        Then User Verifies The "PROA - Production Order (to allow access)" Summary Card Has Textbox With Placeholder "Enter a Number of days" And Enters "30"
        When User Clicks On The "Save changes" Button
        Then User Sees Success Banner "Result codes applied successfully"
        Then User Should See Tag "Existing" In Summary Card "PROA - Production Order (to allow access)"
        Then User Selects "COST - Costs granted" From The Textbox "Result code" Autocomplete By Typing "COST"
        Then User Should See Summary Card With Title "COST - Costs granted"
        Then User Should See Tag "Pending" In Summary Card "COST - Costs granted"
        Then User Should See The Link "Remove" In Summary Card "COST - Costs granted"
        Then User Should See "Wording" In Summary Card "COST - Costs granted"
        Then User Should See "Application for costs granted in the sum of" In Summary Card "COST - Costs granted"
        Then User Verifies The "COST - Costs granted" Summary Card Has Textbox With Placeholder "Enter a Amount of costs" And Enters "500"
        When User Clicks On The "Save changes" Button
        Then User Sees Success Banner "Result codes applied successfully"
        Then User Should See Tag "Existing" In Summary Card "COST - Costs granted"
        Then User Clicks On The Breadcrumb Link "Applications list details"
        Then User Should See Row In Table "Lists" With Values:
            | Sequence number | Account number | Applicant                        | Respondent                     | Post code | Title                                          | Fee req | Resulted        |
            | 1               |                | Test Acme Industries {RANDOM}    | Test Respondent Ltd {RANDOM}   | BS15 5AA  | Issue of liability order summons - council tax | No      | PROA, COST      |
            | 2               | ACC-{RANDOM}   | Mr, Henry James, Taylor {RANDOM} | Ms, Emily Rose, Clark {RANDOM} | BS15 5AA  | Collection Order - Financial Penalty Account   | No      | RTC, PROA, COST |
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | SearchDate | APIDate  | DisplayDate  | Time           | courtLocationCode | Court                     | Description                             | Entries | Status |
            | user2 | today      | todayiso | todaydisplay | timenowhhmm-3h | BCC026            | Bristol Crown Court Set 3 | Applications to review at Test_{RANDOM} | 2       | OPEN   |