Feature: Applications Bulk Result Selected

    @regression @ARCPOC-214 @ARCPOC-1335 @ARCPOC-1495
    Scenario Outline: Bulk result selected applications from Applications search page
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
            | applicationCode                               | AD99001                                   |
            | respondent.person.name.title                  | Mr                                        |
            | respondent.person.name.lastName               | Smith {RANDOM}                            |
            | respondent.person.name.firstName              | John                                      |
            | respondent.person.name.middleName             | Edward                                    |
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
            | applicationCode                                     | RE99002                                       |
            | applicant.person.name.title                         | Mrs                                           |
            | applicant.person.name.lastName                      | Johnson {RANDOM}                              |
            | applicant.person.name.firstName                     | Sarah                                         |
            | applicant.person.name.middleName                    | Louise                                        |
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
            | wordingFields.0.key                                 | Premises Address                              |
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
            | respondent.person.name.lastName                    | Williams {RANDOM}                             |
            | respondent.person.name.firstName                   | Emma                                          |
            | respondent.person.name.middleName                  | Jane                                          |
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
        # UI: Search and Bulk Result Selected
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link Using Exact Text Match "Applications"
        Then User Verify The Page URL Contains "/applications"
        When User Searches Applications With:
            | Date  | CourtSearch | Court | Applicant organisation | Applicant surname | Respondent organisation | Respondent surname | Select application status | Respondent post code | CJASearch | Criminal justice area | Other location description | Standard applicant code | Account reference |
            | today |             |       |                        |                   |                         |                    |                           |                      |           |                       |                            |                         | ACC-{RANDOM}      |
        Then User Should See Row In Table "Application list entries" With Values:
            | Date         | Applicant                    | Respondent                | Application title                              | Fee | Resulted | Status |
            | todaydisplay | Innovative Solutions Inc     | John Smith {RANDOM}       | Copy documents                                 | Yes | No       | OPEN   |
            | todaydisplay | Sarah Johnson {RANDOM}       | Finance Corp LTD {RANDOM} | Rights of Entry Warrant - Electricity Operator | Yes | No       | OPEN   |
            | todaydisplay | ACME Industries LTD {RANDOM} | Emma Williams {RANDOM}    | Condemnation of Unfit Food                     | Yes | No       | OPEN   |
        When User Checks The Select All Checkbox In Table "Application list entries"
        When User Clicks "Actions" Then "Result selected" From Caption Menu In Table "Application list entries"
        Then User See "Result applications" On The Page
        # Verify all 3 selected rows appear on the result page
        Then User Should See Row In Table "Application(s) to result" With Values:
            | Date         | Applicant                    | Respondent                | Application title                              |
            | todaydisplay | Innovative Solutions Inc     | John Smith {RANDOM}       | Copy documents                                 |
            | todaydisplay | Sarah Johnson {RANDOM}       | Finance Corp LTD {RANDOM} | Rights of Entry Warrant - Electricity Operator |
            | todaydisplay | ACME Industries LTD {RANDOM} | Emma Williams {RANDOM}    | Condemnation of Unfit Food                     |
        Then User Should See The Button "Save changes" Is Disabled
        Then User Selects " " From The Textbox "Result code" Autocomplete By Typing "abc"
        Then User Verifies "No results found" Is Visible Under The "Result code" Textbox
        # Apply RTC with wording validation, then remove it
        Then User Selects "RTC - Refer to Court" From The Textbox "Result code" Autocomplete By Typing "RTC"
        Then User Should See Summary Card With Title "RTC - Refer to Court"
        Then User Should See Tag "Pending" In Summary Card "RTC - Refer to Court"
        Then User Should See The Link "Remove" In Summary Card "RTC - Refer to Court"
        Then User Clicks The Link "Remove" In Summary Card "RTC - Refer to Court"
        Then User Selects "RTC - Refer to Court" From The Textbox "Result code" Autocomplete By Typing "RTC"
        Then User Should See "Wording" In Summary Card "RTC - Refer to Court"
        Then User Should See "Referred for full court hearing on" In Summary Card "RTC - Refer to Court"
        When User Clicks On The "Save changes" Button
        Then User Sees Validation Error Banner "There is a problem Enter a Date in the result wording section Enter a Courthouse in the result wording section"
        Then User Verifies The "RTC - Refer to Court" Summary Card Has Textbox With Placeholder "Enter a Date" And Enters "01/04/2026"
        When User Clicks On The "Save changes" Button
        Then User Sees Validation Error Banner "There is a problem Enter a Courthouse in the result wording section"
        Then User Verifies The "RTC - Refer to Court" Summary Card Has Textbox With Placeholder "Enter a Courthouse" And Enters "Bristol Crown Court"
        Then User Selects "PROA - Production Order (to allow access)" From The Textbox "Result code" Autocomplete By Typing "PROA"
        Then User Should See Summary Card With Title "PROA - Production Order (to allow access)"
        Then User Should See Tag "Pending" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See The Link "Remove" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See "Wording" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See "Production Order made for access to be allowed to material within" In Summary Card "PROA - Production Order (to allow access)"
        Then User Verifies The "PROA - Production Order (to allow access)" Summary Card Has Textbox With Placeholder "Enter a Number of days" And Enters "30"
        Then User Selects "COST - Costs granted" From The Textbox "Result code" Autocomplete By Typing "COST"
        Then User Should See Summary Card With Title "COST - Costs granted"
        Then User Should See Tag "Pending" In Summary Card "COST - Costs granted"
        Then User Should See The Link "Remove" In Summary Card "COST - Costs granted"
        Then User Should See "Wording" In Summary Card "COST - Costs granted"
        Then User Should See "Application for costs granted in the sum of" In Summary Card "COST - Costs granted"
        Then User Verifies The "COST - Costs granted" Summary Card Has Textbox With Placeholder "Enter a Amount of costs" And Enters "500"
        When User Clicks On The "Save changes" Button
        Then User Sees Success Banner "Result codes applied successfully" Containing "Result code(s) 'RTC, PROA, COST' applied successfully to application(s)"
        Then User Should See Tag "Existing" In Summary Card "RTC - Refer to Court"
        Then User Should See Tag "Existing" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See Tag "Existing" In Summary Card "COST - Costs granted"
        Then User Clicks On The Breadcrumb Link "Applications"
        Then User Should See Row In Table "Application list entries" With Values:
            | Date         | Applicant                    | Respondent                | Application title                              | Fee | Resulted | Status |
            | todaydisplay | Innovative Solutions Inc     | John Smith {RANDOM}       | Copy documents                                 | Yes | Yes      | OPEN   |
            | todaydisplay | Sarah Johnson {RANDOM}       | Finance Corp LTD {RANDOM} | Rights of Entry Warrant - Electricity Operator | Yes | Yes      | OPEN   |
            | todaydisplay | ACME Industries LTD {RANDOM} | Emma Williams {RANDOM}    | Condemnation of Unfit Food                     | Yes | Yes      | OPEN   |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Application list entries" With:
            | Date         | Applicant                | Respondent          | Application title | Fee | Resulted | Status |
            | todaydisplay | Innovative Solutions Inc | John Smith {RANDOM} | Copy documents    | Yes | Yes      | OPEN   |
        Then User Sees Page Heading "Applications list entry update"
        Then User Should See Tag "Existing" In Summary Card "RTC - Refer to Court"
        Then User Should See Tag "Existing" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See Tag "Existing" In Summary Card "COST - Costs granted"
        Then User Clicks On The Breadcrumb Link "Applications"
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Application list entries" With:
            | Date         | Applicant              | Respondent                | Application title                              | Fee | Resulted | Status |
            | todaydisplay | Sarah Johnson {RANDOM} | Finance Corp LTD {RANDOM} | Rights of Entry Warrant - Electricity Operator | Yes | Yes      | OPEN   |
        Then User Sees Page Heading "Applications list entry update"
        Then User Should See Tag "Existing" In Summary Card "RTC - Refer to Court"
        Then User Should See Tag "Existing" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See Tag "Existing" In Summary Card "COST - Costs granted"
        Then User Clicks On The Breadcrumb Link "Applications"
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Application list entries" With:
            | Date         | Applicant                    | Respondent             | Application title          | Fee | Resulted | Status |
            | todaydisplay | ACME Industries LTD {RANDOM} | Emma Williams {RANDOM} | Condemnation of Unfit Food | Yes | Yes      | OPEN   |
        Then User Sees Page Heading "Applications list entry update"
        Then User Should See Tag "Existing" In Summary Card "RTC - Refer to Court"
        Then User Should See Tag "Existing" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See Tag "Existing" In Summary Card "COST - Costs granted"
        Then User Clicks On The Breadcrumb Link "Applications"
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"

        Examples:
            | User  |
            | user1 |

    @regression @applicationListEntry @ARCPOC-222 @ARCPOC-1335
    Scenario Outline: Verify Validation Error Message For Closed Applications Bulk Result Selected
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Applications"
        Then User Verify The Page URL Contains "/applications"
        When User Toggles The Accordion "Advanced search"
        When User Searches Applications With:
            | Date | CourtSearch | Court | Applicant organisation | Applicant surname | Respondent organisation | Respondent surname | Select application status | Respondent post code | CJASearch | Criminal justice area | Other location description | Standard applicant code | Account reference |
            |      |             |       |                        |                   |                         |                    | Closed                    |                      |           |                       |                            |                         |                   |
        Then User Should See Table "<TableName>" Has Sortable Headers "Date, Applicant, Respondent, Application title, Fee, Resulted, Status"
        And User Should See Table "<TableName>" Header "Actions" Is Not Sortable
        When User Checks The Checkbox In Row 1 Of Table "<TableName>"
        When User Clicks "Actions" Then "Result selected" From Caption Menu In Table "Entries"
        Then User Sees Validation Error Banner "There is a problem You can only result open application(s)"

        Examples:
            | TableName                |
            | Application list entries |