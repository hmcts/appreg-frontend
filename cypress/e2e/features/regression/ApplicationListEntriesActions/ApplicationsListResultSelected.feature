Feature: Applications List Result

    @regression @applicationsList @ARCPOC-965 @ARCPOC-1072 @ARCPOC-1267 @ARCPOC-1226
    Scenario Outline: Application List - Result Selected - 5 ALEs Mixed Applicant Types
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Entry 1 - Organisation applicant + Organisation respondent
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
        # Entry 2 - Person applicant + Person respondent
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
            | respondent.person.dateOfBirth                 | todayiso-25y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | true                           |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-E2-{RANDOM}                |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        # Entry 3 - Person applicant + Organisation respondent
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                           |
            | applicationCode                                     | EF99001                        |
            | applicant.person.name.title                         | Mrs                            |
            | applicant.person.name.surname                       | Johnson {RANDOM}               |
            | applicant.person.name.firstForename                 | Sarah                          |
            | applicant.person.name.secondForename                | Louise                         |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} High Street           |
            | applicant.person.contactDetails.addressLine2        | Manchester                     |
            | applicant.person.contactDetails.addressLine3        | Greater Manchester             |
            | applicant.person.contactDetails.postcode            | M1 1AA                         |
            | applicant.person.contactDetails.phone               | 0161{RANDOM}                   |
            | applicant.person.contactDetails.mobile              | 07700{RANDOM}                  |
            | applicant.person.contactDetails.email               | applicant{RANDOM}@example.com  |
            | respondent.organisation.name                        | Greenfield Consulting {RANDOM} |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Park Lane             |
            | respondent.organisation.contactDetails.addressLine2 | Birmingham                     |
            | respondent.organisation.contactDetails.addressLine3 | West Midlands                  |
            | respondent.organisation.contactDetails.postcode     | B1 1AA                         |
            | respondent.organisation.contactDetails.phone        | 0121{RANDOM}                   |
            | respondent.organisation.contactDetails.mobile       | 07800{RANDOM}                  |
            | wordingFields.0.key                                 | account balance                |
            | wordingFields.0.value                               | {RANDOM}                       |
            | hasOffsiteFee                                       | false                          |
            | caseReference                                       | CASE-{RANDOM}                  |
            | accountNumber                                       | ACC-E3-{RANDOM}                |
            | notes                                               | Case noted with ref {RANDOM}   |
            | lodgementDate                                       | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        # Entry 4 - Organisation applicant + Person respondent
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                              | null                           |
            | applicationCode                                    | CT99002                        |
            | applicant.organisation.name                        | Apex Solutions Ltd {RANDOM}    |
            | applicant.organisation.contactDetails.addressLine1 | {RANDOM} King Street           |
            | applicant.organisation.contactDetails.addressLine2 | Leeds                          |
            | applicant.organisation.contactDetails.addressLine3 | West Yorkshire                 |
            | applicant.organisation.contactDetails.addressLine4 | United Kingdom                 |
            | applicant.organisation.contactDetails.postcode     | WS4A 5AA                       |
            | applicant.organisation.contactDetails.phone        | 0113{RANDOM}                   |
            | applicant.organisation.contactDetails.mobile       | 07600{RANDOM}                  |
            | applicant.organisation.contactDetails.email        | {RANDOM}@example.com           |
            | respondent.person.name.title                       | Mr                             |
            | respondent.person.name.surname                     | Smith {RANDOM}                 |
            | respondent.person.name.firstForename               | John                           |
            | respondent.person.contactDetails.addressLine1      | {RANDOM} Queen Street          |
            | respondent.person.contactDetails.addressLine2      | Leeds                          |
            | respondent.person.contactDetails.addressLine3      | West Yorkshire                 |
            | respondent.person.contactDetails.postcode          | LS1 1AA                        |
            | respondent.person.contactDetails.phone             | 0113{RANDOM}                   |
            | respondent.person.contactDetails.mobile            | 07500{RANDOM}                  |
            | respondent.person.contactDetails.email             | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                      | todayiso-30y                   |
            | wordingFields.0.key                                | Reference                      |
            | wordingFields.0.value                              | {RANDOM}                       |
            | hasOffsiteFee                                      | true                           |
            | caseReference                                      | CASE-{RANDOM}                  |
            | notes                                              | Case noted with ref {RANDOM}   |
            | lodgementDate                                      | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        # Entry 5 - Person applicant + Person respondent (pre-set with result via API)
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | EF99001                        |
            | applicant.person.name.title                   | Mr                             |
            | applicant.person.name.surname                 | Brown {RANDOM}                 |
            | applicant.person.name.firstForename           | James                          |
            | applicant.person.name.secondForename          | Edward                         |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} Victoria Road         |
            | applicant.person.contactDetails.addressLine2  | Sheffield                      |
            | applicant.person.contactDetails.addressLine3  | South Yorkshire                |
            | applicant.person.contactDetails.postcode      | S1 1AA                         |
            | applicant.person.contactDetails.phone         | 0114{RANDOM}                   |
            | applicant.person.contactDetails.mobile        | 07400{RANDOM}                  |
            | applicant.person.contactDetails.email         | applicant{RANDOM}@example.com  |
            | respondent.person.name.title                  | Ms                             |
            | respondent.person.name.surname                | Davis {RANDOM}                 |
            | respondent.person.name.firstForename          | Laura                          |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Church Lane           |
            | respondent.person.contactDetails.addressLine2 | Liverpool                      |
            | respondent.person.contactDetails.addressLine3 | Merseyside                     |
            | respondent.person.contactDetails.postcode     | L1 1AA                         |
            | respondent.person.contactDetails.phone        | 0151{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07300{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-35y                   |
            | wordingFields.0.key                           | account balance                |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-E5-{RANDOM}                |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
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
        # Entry 6 - Standard applicant APP036 + Person respondent
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | APP036                         |
            | applicationCode                               | CT99002                        |
            | respondent.person.name.title                  | Mr                             |
            | respondent.person.name.surname                | Wilson {RANDOM}                |
            | respondent.person.name.firstForename          | Robert                         |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Station Road          |
            | respondent.person.contactDetails.addressLine2 | Newcastle                      |
            | respondent.person.contactDetails.addressLine3 | Tyne and Wear                  |
            | respondent.person.contactDetails.postcode     | NE1 1AA                        |
            | respondent.person.contactDetails.phone        | 0191{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07200{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-40y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-E6-{RANDOM}                |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        # Entry 7 - Standard applicant APP013 + Organisation respondent
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | APP013                       |
            | applicationCode                                     | EF99001                      |
            | respondent.organisation.name                        | Metro Finance Ltd {RANDOM}   |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Broad Street        |
            | respondent.organisation.contactDetails.addressLine2 | Edinburgh                    |
            | respondent.organisation.contactDetails.addressLine3 | Scotland                     |
            | respondent.organisation.contactDetails.postcode     | EH1 1AA                      |
            | respondent.organisation.contactDetails.phone        | 0131{RANDOM}                 |
            | respondent.organisation.contactDetails.mobile       | 07100{RANDOM}                |
            | wordingFields.0.key                                 | account balance              |
            | wordingFields.0.value                               | {RANDOM}                     |
            | hasOffsiteFee                                       | true                         |
            | caseReference                                       | CASE-{RANDOM}                |
            | accountNumber                                       | ACC-E7-{RANDOM}              |
            | notes                                               | Case noted with ref {RANDOM} |
            | lodgementDate                                       | todayiso                     |
        Then User Verify Response Status Code Should Be "201"
        # Entry 8 - Person applicant + Person respondent with MX99019 (fee-bearing)
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | MX99019                        |
            | applicant.person.name.title                   | Mr                             |
            | applicant.person.name.surname                 | Hughes {RANDOM}                |
            | applicant.person.name.firstForename           | Daniel                         |
            | applicant.person.name.secondForename          | Paul                           |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} Bridge Street         |
            | applicant.person.contactDetails.addressLine2  | Cardiff                        |
            | applicant.person.contactDetails.addressLine3  | Wales                          |
            | applicant.person.contactDetails.addressLine4  | United Kingdom                 |
            | applicant.person.contactDetails.postcode      | CF10 1AA                       |
            | applicant.person.contactDetails.phone         | 029{RANDOM}                    |
            | applicant.person.contactDetails.mobile        | 07900{RANDOM}                  |
            | applicant.person.contactDetails.email         | applicant{RANDOM}@example.com  |
            | respondent.person.name.title                  | Mrs                            |
            | respondent.person.name.surname                | Hughes {RANDOM}                |
            | respondent.person.name.firstForename          | Claire                         |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Mill Lane             |
            | respondent.person.contactDetails.addressLine2 | Cardiff                        |
            | respondent.person.contactDetails.addressLine3 | Wales                          |
            | respondent.person.contactDetails.addressLine4 | United Kingdom                 |
            | respondent.person.contactDetails.postcode     | CF10 2AA                       |
            | respondent.person.contactDetails.phone        | 029{RANDOM}                    |
            | respondent.person.contactDetails.mobile       | 07800{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-28y                   |
            | feeStatuses.0.paymentReference                |                                |
            | feeStatuses.0.paymentStatus                   | <feeStatusDue>                 |
            | feeStatuses.0.statusDate                      | <feeStatusDate>                |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-E8-{RANDOM}                |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
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
        # Verify default sort order - Sequence number ascending
        Then User Should See Table "Entries" Header "Sequence number" Has Sort Order "ascending"
        Then User Should See Table "Entries" Header "Account number" Has Sort Order "none"
        Then User Should See Table "Entries" Header "Applicant" Has Sort Order "none"
        Then User Should See Table "Entries" Header "Respondent" Has Sort Order "none"
        Then User Should See Table "Entries" Header "Postcode" Has Sort Order "none"
        Then User Should See Table "Entries" Header "Title" Has Sort Order "none"
        Then User Should See Table "Entries" Header "Fee" Has Sort Order "none"
        Then User Should See Table "Entries" Header "Resulted" Has Sort Order "none"
        # Verify all 8 rows
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number  | Applicant                           | Respondent                     | Postcode | Title                                                      | Fee | Resulted |
            | 1               |                 | Test Acme Industries {RANDOM}       | Test Respondent Ltd {RANDOM}   | BS15 5AA | Issue of liability order summons - council tax             | No  |          |
            | 2               | ACC-E2-{RANDOM} | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | BS15 5AA | Issue of liability order summons - council tax             | No  |          |
            | 3               | ACC-E3-{RANDOM} | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | B1 1AA   | Collection Order - Financial Penalty Account               | No  |          |
            | 4               |                 | Apex Solutions Ltd {RANDOM}         | Mr, John, Smith {RANDOM}       | LS1 1AA  | Issue of liability order summons - council tax             | No  |          |
            | 5               | ACC-E5-{RANDOM} | Mr, James Edward, Brown {RANDOM}    | Ms, Laura, Davis {RANDOM}      | L1 1AA   | Collection Order - Financial Penalty Account               | No  | RTC      |
            | 6               | ACC-E6-{RANDOM} | Innovative Solutions Inc            | Mr, Robert, Wilson {RANDOM}    | NE1 1AA  | Issue of liability order summons - council tax             | No  |          |
            | 7               | ACC-E7-{RANDOM} | Ms, Amelia, Hall                    | Metro Finance Ltd {RANDOM}     | EH1 1AA  | Collection Order - Financial Penalty Account               | No  |          |
            | 8               | ACC-E8-{RANDOM} | Mr, Daniel Paul, Hughes {RANDOM}    | Mrs, Claire, Hughes {RANDOM}   | CF10 2AA | Application for order re public health measures (premises) | Yes |          |
        # Sort by each column ascending and verify sort order changes
        When User Clicks On Table Header "Account number" In Table "Entries"
        Then User Should See Table "Entries" Header "Account number" Has Sort Order "ascending"
        Then User Should See Table "Entries" Header "Sequence number" Has Sort Order "none"
        When User Clicks On Table Header "Applicant" In Table "Entries"
        Then User Should See Table "Entries" Header "Applicant" Has Sort Order "ascending"
        Then User Should See Table "Entries" Header "Account number" Has Sort Order "none"
        When User Clicks On Table Header "Respondent" In Table "Entries"
        Then User Should See Table "Entries" Header "Respondent" Has Sort Order "ascending"
        Then User Should See Table "Entries" Header "Applicant" Has Sort Order "none"
        When User Clicks On Table Header "Postcode" In Table "Entries"
        Then User Should See Table "Entries" Header "Postcode" Has Sort Order "ascending"
        Then User Should See Table "Entries" Header "Respondent" Has Sort Order "none"
        When User Clicks On Table Header "Title" In Table "Entries"
        Then User Should See Table "Entries" Header "Title" Has Sort Order "ascending"
        Then User Should See Table "Entries" Header "Postcode" Has Sort Order "none"
        When User Clicks On Table Header "Fee" In Table "Entries"
        Then User Should See Table "Entries" Header "Fee" Has Sort Order "ascending"
        Then User Should See Table "Entries" Header "Title" Has Sort Order "none"
        When User Clicks On Table Header "Resulted" In Table "Entries"
        Then User Should See Table "Entries" Header "Resulted" Has Sort Order "ascending"
        Then User Should See Table "Entries" Header "Fee" Has Sort Order "none"
        # Sort descending by clicking again
        When User Clicks On Table Header "Resulted" In Table "Entries"
        Then User Should See Table "Entries" Header "Resulted" Has Sort Order "descending"
        # Return to default Sequence number ascending
        When User Clicks On Table Header "Sequence number" In Table "Entries"
        Then User Should See Table "Entries" Header "Sequence number" Has Sort Order "ascending"
        Then User Should See The Button "Actions" Is Disabled
        # Select rows 2, 3 and 5 in one step
        When User Checks The Checkbox In Row Of Table "Entries" With:
            | Sequence number | Account number  | Applicant                           | Respondent                     | Postcode | Title                                          | Fee | Resulted |
            | 2               | ACC-E2-{RANDOM} | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | BS15 5AA | Issue of liability order summons - council tax | No  |          |
            | 3               | ACC-E3-{RANDOM} | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | B1 1AA   | Collection Order - Financial Penalty Account   | No  |          |
            | 5               | ACC-E5-{RANDOM} | Mr, James Edward, Brown {RANDOM}    | Ms, Laura, Davis {RANDOM}      | L1 1AA   | Collection Order - Financial Penalty Account   | No  | RTC      |
        Then User Should See The Button "Actions" Is Enabled
        When User Clicks "Actions" Then "Result selected" From Caption Menu In Table "Entries"
        Then User See "Result applications" On The Page
        # Verify all 3 selected rows appear on the result page
        Then User Should See Row In Table "Application(s) to result" With Values:
            | Sequence number | Applicant(s)                        | Respondent(s)                  | Application Title(s)                           |
            | 2               | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | Issue of liability order summons - council tax |
            | 3               | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | Collection Order - Financial Penalty Account   |
            | 5               | Mr, James Edward, Brown {RANDOM}    | Ms, Laura, Davis {RANDOM}      | Collection Order - Financial Penalty Account   |
        Then User Should See The Button "Save changes" Is Disabled
        Then User Selects " " From The Textbox "Result code" Autocomplete By Typing "abc"
        Then User Verifies "No results found" Is Visible Under The "Result code" Textbox
        # Apply RTC with wording validation, then remove it
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
        Then User Sees Success Banner "Result codes applied successfully" Containing "RTC"
        Then User Clicks The Link "Remove" In Summary Card "RTC - Refer to Court"
        Then User Sees Success Banner "Results removed The results have been removed from these application list entries."
        # Apply PROA with wording (number of days)
        Then User Selects "PROA - Production Order (to allow access)" From The Textbox "Result code" Autocomplete By Typing "PROA"
        Then User Should See Summary Card With Title "PROA - Production Order (to allow access)"
        Then User Should See Tag "Pending" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See The Link "Remove" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See "Wording" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See "Production Order made for access to be allowed to material within" In Summary Card "PROA - Production Order (to allow access)"
        Then User Verifies The "PROA - Production Order (to allow access)" Summary Card Has Textbox With Placeholder "Enter a Number of days" And Enters "30"
        When User Clicks On The "Save changes" Button
        Then User Sees Success Banner "Result codes applied successfully" Containing "PROA"
        Then User Should See Tag "Existing" In Summary Card "PROA - Production Order (to allow access)"
        # Apply COST with wording (amount)
        Then User Selects "COST - Costs granted" From The Textbox "Result code" Autocomplete By Typing "COST"
        Then User Should See Summary Card With Title "COST - Costs granted"
        Then User Should See Tag "Pending" In Summary Card "COST - Costs granted"
        Then User Should See The Link "Remove" In Summary Card "COST - Costs granted"
        Then User Should See "Wording" In Summary Card "COST - Costs granted"
        Then User Should See "Application for costs granted in the sum of" In Summary Card "COST - Costs granted"
        Then User Verifies The "COST - Costs granted" Summary Card Has Textbox With Placeholder "Enter a Amount of costs" And Enters "500"
        When User Clicks On The "Save changes" Button
        Then User Sees Success Banner "Result codes applied successfully" Containing "COST"
        Then User Should See Tag "Existing" In Summary Card "COST - Costs granted"
        Then User Clicks On The Breadcrumb Link "Applications list details"
        # Verify rows 2, 3, 5 have PROA and COST applied; row 5 retains pre-existing RTC; rows 1, 4, 6, 7, 8 unchanged
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number  | Applicant                           | Respondent                     | Postcode | Title                                          | Fee | Resulted        |
            | 2               | ACC-E2-{RANDOM} | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | BS15 5AA | Issue of liability order summons - council tax | No  | PROA, COST      |
            | 3               | ACC-E3-{RANDOM} | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | B1 1AA   | Collection Order - Financial Penalty Account   | No  | PROA, COST      |
            | 5               | ACC-E5-{RANDOM} | Mr, James Edward, Brown {RANDOM}    | Ms, Laura, Davis {RANDOM}      | L1 1AA   | Collection Order - Financial Penalty Account   | No  | RTC, PROA, COST |
        # Application List Cleanup
        # When User Makes DELETE API Request To "/application-lists/:listId"
        # Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | Status | Description                             | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                     | feeStatusDue | feeStatusDate |
            | user2 | todayiso | timenowhhmm-3h | OPEN   | Applications to review at Test_{RANDOM} | BCC026            | today      | todayDisplay | 8       | Bristol Crown Court Set 3 | DUE          | todayiso      |