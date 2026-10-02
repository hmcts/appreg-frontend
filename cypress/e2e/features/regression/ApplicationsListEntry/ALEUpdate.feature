Feature: Applications List Entry Update

    @applicationListEntry @regression @core @ARCPOC-222 @ARCPOC-428 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @ARCPOC-1444 @ARCPOC-1558 @ARCPOC-1228 @ARCPOC-1789 @ARCPOC-1748 @ARCPCOC-1822
    Scenario: Update an ALE where Applicant = Person and Respondent = Person, using an Application Code with Fee Required = Y and Respondent Required = Y
        Given User Authenticates Via API As "user1"
        # Create Application List
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time  | status | description                                  | courtLocationCode |
            | todayiso | 10:20 | OPEN   | Applications to review at Test_{SCENARIO_ID} | LCCC065           |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Create Application List Entry - Person applicant + Person respondent, Application Code with Fee Required = Y and Respondent Required = Y
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                                |
            | applicationCode                               | MX99006                             |
            | applicant.person.name.title                   | Mr                                  |
            | applicant.person.name.lastName                | Taylor {SCENARIO_ID}                |
            | applicant.person.name.firstName               | Henry                               |
            | applicant.person.contactDetails.addressLine1  | {SCENARIO_ID} King Street           |
            | applicant.person.contactDetails.addressLine2  | Westminster                         |
            | applicant.person.contactDetails.addressLine3  | London                              |
            | applicant.person.contactDetails.postcode      | SW1A 1AA                            |
            | applicant.person.contactDetails.phone         | 01632960001                         |
            | applicant.person.contactDetails.mobile        | 07700900001                         |
            | applicant.person.contactDetails.email         | applicant{SCENARIO_ID}@example.com  |
            | respondent.person.name.title                  | Ms                                  |
            | respondent.person.name.lastName               | Clark {SCENARIO_ID}                 |
            | respondent.person.name.firstName              | Emily                               |
            | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Road           |
            | respondent.person.contactDetails.addressLine2 | Bristol                             |
            | respondent.person.contactDetails.postcode     | BS15 5AA                            |
            | respondent.person.contactDetails.phone        | 01632960001                         |
            | respondent.person.contactDetails.mobile       | 07700900001                         |
            | respondent.person.contactDetails.email        | respondent{SCENARIO_ID}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-25y                        |
            | wordingFields.0.key                           | Describe Seized Food                |
            | wordingFields.0.value                         | {SCENARIO_ID}                       |
            | feeStatuses.0.paymentReference                | PAY-E5-{RANDOM}                     |
            | feeStatuses.0.paymentStatus                   | PAID                                |
            | feeStatuses.0.statusDate                      | todayiso                            |
            | hasOffsiteFee                                 | false                               |
            | caseReference                                 | CASEE1{RANDOM}                      |
            | accountNumber                                 | ACCSE1{RANDOM}                      |
            | notes                                         | Entry search person person          |
            | lodgementDate                                 | todayiso                            |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        When User Signs In With Microsoft SSO As "user1"
        # Search and Open Created Application List
        When User Searches Application List With:
            | Date  | Time | List description                             | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
            | today |      | Applications to review at Test_{SCENARIO_ID} |             |       | OPEN               |                            |                       |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date         | Time  | Location                          | Description                                  | Entries | Status |
            | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{SCENARIO_ID} | 1       | OPEN   |
        # Search and Open Created Application List Entry
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Entries" With:
            | Sequence number | Account number | Applicant                  | Respondent                | Postcode | Title                      | Fee | Resulted |
            | 1               | ACCSE1{RANDOM} | Henry Taylor {SCENARIO_ID} | Emily Clark {SCENARIO_ID} | BS15 5AA | Condemnation of Unfit Food | Yes |          |
        When User Clicks On The "Show all sections" Button
        Then User Should See The Button "Hide all sections"
        Then User Sees Page Heading "Applications list entry update"
        Then User See "Summary of application list entry" On The Page
        # Civil fee payment reference update @ARCPOC-1789
        Then User Clicks "Change" Link In Row Of Table "Current fee statuses table" In The Accordion "Civil fee"
            | Fee Status | Status Date  | Payment Ref     |
            | PAID       | todaydisplay | PAY-E5-{RANDOM} |
        Then User Sees Page Heading "Change payment reference"
        Then User Verifies The "Payment reference" Textbox Has Value "PAY-E5-{RANDOM}"
        Then User Clears The "Payment reference" Textbox
        Then User Enters "PAYUPD-{RANDOM}" Into The "Payment reference" Textbox
        When User Clicks On The "Save" Button
        Then User Sees Success Banner "Payment reference updated" Containing "The payment reference has been updated for the selected fee status."
        Then User Should See The Accordion "Civil fee" Expanded
        Then User Should See Row In Table "Current fee statuses table" In The Accordion "Civil fee" With Values:
            | Fee Status | Status Date  | Payment Ref     |
            | PAID       | todaydisplay | PAYUPD-{RANDOM} |
        #Result Wording - AUTH
        Then User Selects "AUTH - Authorised" From The Textbox "Result code" Autocomplete By Typing "auth"
        Then User Should See Summary Card With Title "AUTH - Authorised"
        Then User Should See Tag "Pending" In Summary Card "AUTH - Authorised"
        Then User Should See The Link "Remove" In Summary Card "AUTH - Authorised"
        Then User Clicks The Link "Remove" In Summary Card "AUTH - Authorised"
        Then User Selects "AUTH - Authorised" From The Textbox "Result code" Autocomplete By Typing "auth"
        Then User Should See Summary Card With Title "AUTH - Authorised"
        Then User Should See Tag "Pending" In Summary Card "AUTH - Authorised"
        Then User Should See The Link "Remove" In Summary Card "AUTH - Authorised"
        Then User Should See "Wording" In Summary Card "AUTH - Authorised"
        Then User Should See "Authorised." In Summary Card "AUTH - Authorised"
        # Reult Wording - PROA
        Then User Selects "PROA - Production Order (to allow access)" From The Textbox "Result code" Autocomplete By Typing "PROA"
        Then User Should See Summary Card With Title "PROA - Production Order (to allow access)"
        Then User Should See Tag "Pending" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See The Link "Remove" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See "Wording" In Summary Card "PROA - Production Order (to allow access)"
        Then User Should See "Production Order made for access to be allowed to material within" In Summary Card "PROA - Production Order (to allow access)"
        Then User Verifies The "PROA - Production Order (to allow access)" Summary Card Has Textbox With Placeholder "Enter a Number of days" And Enters "30"
        # Apply Results
        When User Clicks On The "Apply result" Button
        Then User Sees Success Alert "Results applied to this entry. Save the entry to keep these changes."
        Then User Verifies The Button "Apply result" Is Disabled In The Accordion "Result wording"
        # Officials @ARCPOC-1558
        Then User Enters "HHJ" In The Textbox "Magistrate's title" Under "Magistrate 1" FieldSet In The Accordion "Officials"
        When User Clicks On The "Save recording officials" Button
        Then User Sees Validation Error Banner "There is a problem Magistrates 1 first name is required Magistrates 1 last name is required"
        Then User Enters "John" In The Textbox "Magistrate's first name" Under "Magistrate 1" FieldSet In The Accordion "Officials"
        Then User Enters "Smith{SCENARIO_ID}" In The Textbox "Magistrate's surname" Under "Magistrate 1" FieldSet In The Accordion "Officials"

        Then User Enters "Emily" In The Textbox "Magistrate's first name" Under "Magistrate 2" FieldSet In The Accordion "Officials"
        Then User Enters "Davis{SCENARIO_ID}" In The Textbox "Magistrate's surname" Under "Magistrate 2" FieldSet In The Accordion "Officials"

        Then User Enters "Miss" In The Textbox "Magistrate's title" Under "Magistrate 3" FieldSet In The Accordion "Officials"
        Then User Enters "Jane" In The Textbox "Magistrate's first name" Under "Magistrate 3" FieldSet In The Accordion "Officials"
        Then User Enters "Hardy{SCENARIO_ID}" In The Textbox "Magistrate's surname" Under "Magistrate 3" FieldSet In The Accordion "Officials"

        Then User Enters "Mrs" In The Textbox "Court official's title" Under "Court official" FieldSet In The Accordion "Officials"
        Then User Enters "Violette" In The Textbox "Official's first name" Under "Court official" FieldSet In The Accordion "Officials"
        Then User Enters "Zanetti{SCENARIO_ID}" In The Textbox "Official's surname" Under "Court official" FieldSet In The Accordion "Officials"
        When User Clicks On The "Save recording officials" Button
        Then User Sees Success Banner "Officials updated" Containing "Officials have been updated for this application list entry."
        When User Starts Listening For Result Retrieval
        When User Clicks On The "Save complete application" Button
        Then User Sees Success Banner "Application list entry updated" Containing "The application list entry has been updated successfully."
        # Result Wording - Timestamp
        Then User Stores Updated Date Time For Result "PROA" From Result Retrieval As "proaUpdatedDateTime"
        Then User Verifies The Local Updated Date And Time In Summary Card "PROA - Production Order (to allow access)" From Alias "proaUpdatedDateTime"
        # Remove Result to check 'Removed' banner
        Then User Clicks The Link "Remove" In Summary Card "PROA - Production Order (to allow access)"
        Then User Sees Success Banner "Result removed" Containing "The result has been removed from this application list entry."

    @applicationListEntry @regression @ARCPOC-1707
    Scenario: Update Application List Entry, Change Application Code, expect wording and fee accordion to be expanded
        Given User Authenticates Via API As "user1"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time  | status | description                                  | courtLocationCode |
            | todayiso | 10:20 | OPEN   | Applications to review at Test_{SCENARIO_ID} | LCCC065           |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Create Application List Entry - Person applicant + Person respondent, Application Code with Fee Required = Y and Respondent Required = Y
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                                |
            | applicationCode                               | MX99006                             |
            | applicant.person.name.title                   | Mr                                  |
            | applicant.person.name.lastName                | Taylor {SCENARIO_ID}                |
            | applicant.person.name.firstName               | Henry                               |
            | applicant.person.contactDetails.addressLine1  | {SCENARIO_ID} King Street           |
            | applicant.person.contactDetails.addressLine2  | Westminster                         |
            | applicant.person.contactDetails.addressLine3  | London                              |
            | applicant.person.contactDetails.postcode      | SW1A 1AA                            |
            | applicant.person.contactDetails.phone         | 01632960001                         |
            | applicant.person.contactDetails.mobile        | 07700900001                         |
            | applicant.person.contactDetails.email         | applicant{SCENARIO_ID}@example.com  |
            | respondent.person.name.title                  | Ms                                  |
            | respondent.person.name.lastName               | Clark {SCENARIO_ID}                 |
            | respondent.person.name.firstName              | Emily                               |
            | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Road           |
            | respondent.person.contactDetails.addressLine2 | Bristol                             |
            | respondent.person.contactDetails.postcode     | BS15 5AA                            |
            | respondent.person.contactDetails.phone        | 01632960001                         |
            | respondent.person.contactDetails.mobile       | 07700900001                         |
            | respondent.person.contactDetails.email        | respondent{SCENARIO_ID}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-25y                        |
            | wordingFields.0.key                           | Describe Seized Food                |
            | wordingFields.0.value                         | {SCENARIO_ID}                       |
            | feeStatuses.0.paymentReference                | PAY-E5-{RANDOM}                     |
            | feeStatuses.0.paymentStatus                   | PAID                                |
            | feeStatuses.0.statusDate                      | todayiso                            |
            | hasOffsiteFee                                 | false                               |
            | caseReference                                 | CASEE1{RANDOM}                      |
            | accountNumber                                 | ACCSE1{RANDOM}                      |
            | notes                                         | Entry search person person          |
            | lodgementDate                                 | todayiso                            |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        When User Signs In With Microsoft SSO As "user1"
        # Search and Open Created Application List
        When User Searches Application List With:
            | Date  | Time | List description                             | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
            | today |      | Applications to review at Test_{SCENARIO_ID} |             |       | OPEN               |                            |                       |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date         | Time  | Location                          | Description                                  | Entries | Status |
            | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{SCENARIO_ID} | 1       | OPEN   |
        # Search and Open Created Application List Entry
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Entries" With:
            | Sequence number | Account number | Applicant                  | Respondent                | Postcode | Title                      | Fee | Resulted |
            | 1               | ACCSE1{RANDOM} | Henry Taylor {SCENARIO_ID} | Emily Clark {SCENARIO_ID} | BS15 5AA | Condemnation of Unfit Food | Yes |          |
        Then User Sees Page Heading "Applications list entry update"
        Then User See "Summary of application list entry" On The Page
        Then User Enters "MX99002" Into The Textbox "Application code" In The Accordion "Application codes"
        When User Clicks On The "Search" Button In The Accordion "Application codes"
        Then User Verifies Table "Codes" Has Sortable Headers "Code, Title, Bulk, Fee required" In The Accordion "Application codes"
        Then User Clicks "Add code" Button In Row Of Table "Codes" In The Accordion "Application codes"
            | Code    | Title          | Bulk | Fee required |
            | MX99002 | Change of name | No   | Yes          |
        Then User Should See The Accordion "Wording" Expanded
        Then User Should See The Accordion "Civil fee" Expanded
        Then User Should See The Text "Attends to make a statutory declaration that henceforth the applicant will be known as " In The Accordion "Wording"
        Then User Should See The Text "Fee Reference: CO7.2 " In The Accordion "Civil fee"

    @ignore @applicationListEntry @ARCPOC-222 @ARCPOC-428 @ARCPOC-1859
    Scenario: Update an ALE Applicant from Organisation to SA, Respondent from Organisation to Bulk Respondnet, using an Application Code with Fee Required = Y and Respondent Required = Y
        Given User Authenticates Via API As "user1"
        # Create Application List
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time  | status | description                                  | courtLocationCode |
            | todayiso | 10:20 | OPEN   | Applications to review at Test_{SCENARIO_ID} | LCCC065           |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Create Application List Entry - Organisation applicant + Organisation respondent, Application Code with Fee Required = Y and Respondent Required = Y
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                                       |
            | applicationCode                                     | MH99001                                    |
            | applicant.organisation.name                         | Test Organisation {SCENARIO_ID}            |
            | applicant.organisation.contactDetails.addressLine1  | {SCENARIO_ID} King Street                  |
            | applicant.organisation.contactDetails.addressLine2  | Westminster                                |
            | applicant.organisation.contactDetails.addressLine3  | London                                     |
            | applicant.organisation.contactDetails.addressLine4  | Greater London                             |
            | applicant.organisation.contactDetails.addressLine5  | United Kingdom                             |
            | applicant.organisation.contactDetails.postcode      | SW1A 1AA                                   |
            | applicant.organisation.contactDetails.phone         | 01632960001                                |
            | applicant.organisation.contactDetails.mobile        | 07700900001                                |
            | applicant.organisation.contactDetails.email         |                                            |
            | respondent.organisation.name                        | Test Respondent Organisation {SCENARIO_ID} |
            | respondent.organisation.contactDetails.addressLine1 | {SCENARIO_ID} Market Road                  |
            | respondent.organisation.contactDetails.addressLine2 | Bristol                                    |
            | respondent.organisation.contactDetails.addressLine3 | Avon                                       |
            | respondent.organisation.contactDetails.addressLine4 | South West                                 |
            | respondent.organisation.contactDetails.addressLine5 | United Kingdom                             |
            | respondent.organisation.contactDetails.postcode     | BS15 5AA                                   |
            | respondent.organisation.contactDetails.phone        | 01632960001                                |
            | respondent.organisation.contactDetails.mobile       | 07700900001                                |
            | respondent.organisation.contactDetails.email        |                                            |
            | wordingFields.0.key                                 | Number                                     |
            | wordingFields.0.value                               | 10                                         |
            | feeStatuses.0.paymentReference                      | PAY-E5-{RANDOM}                            |
            | feeStatuses.0.paymentStatus                         | PAID                                       |
            | feeStatuses.0.statusDate                            | todayiso                                   |
            | hasOffsiteFee                                       | false                                      |
            | caseReference                                       | CASEE1{RANDOM}                             |
            | accountNumber                                       | ACCSE1{RANDOM}                             |
            | notes                                               | Entry search organisation organisation     |
            | lodgementDate                                       | todayiso                                   |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        When User Signs In With Microsoft SSO As "user1"
        # Search and Open Created Application List
        When User Searches Application List With:
            | Date  | Time | List description                             | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
            | today |      | Applications to review at Test_{SCENARIO_ID} |             |       | OPEN               |                            |                       |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date         | Time  | Location                          | Description                                  | Entries | Status |
            | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{SCENARIO_ID} | 1       | OPEN   |
        # Search and Open Created Application List Entry
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Entries" With:
            | Sequence number | Account number | Applicant                       | Respondent                                 | Postcode | Title                                                                     | Fee | Resulted |
            | 1               | ACCSE1{RANDOM} | Test Organisation {SCENARIO_ID} | Test Respondent Organisation {SCENARIO_ID} | BS15 5AA | Issue of warrant of arrest in commitment proceedings - council tax (bulk) | Yes |          |
        Then User Sees Page Heading "Applications list entry update"
        Then User See "Summary of application list entry" On The Page
        # Update Applicant
        Then User Selects "Standard Applicant" In The "Select applicant type" Dropdown
        Then User Enters "BGAS" Into The Textbox "Code" In The Accordion "Applicant"
        When User Clicks On The "Search" Button
        Then User Should See The Text "British Gas Trading Limited" In The Accordion "Applicant"
        Then User Should See The Text "BGAS" In The Accordion "Applicant"
        Then User Checks The Checkbox With Label "Select BGAS" In The Accordion "Applicant"
        When User Clicks On The "Update applicant" Button In The Accordion "Applicant"
        Then User Sees Success Banner "Applicant updated" Containing "The applicant has been updated for this application list entry."
        # Update Respondent
        When User Toggles The Accordion "Respondent"
        When User Fills In The Respondent Details
            | Select type           | Bulk Application |
            | Number of respondents | 5                |
        When User Clicks On The "Save complete application" Button
        Then User Sees Success Banner "Application list entry updated" Containing "The application list entry has been updated successfully."
        Then User Should See The Accordion "Applicant" Expanded
        # Verify Applicant Details
        When User Verifies In The Applicant Details
            | Select applicant type | Standard Applicant |
        Then User Should See The Text "Saved BGAS British Gas Trading Limited" In The Accordion "Applicant"
        Then User Verifies The Checkbox is Checked In Row Of Table "Standard applicants" In The Accordion "Applicant" With:
            | Code | Name                        | Use from   | Use to |
            | BGAS | British Gas Trading Limited | 1 Jun 2016 | —      |
        # Verify Application Codes Details
        Then User Verifies The Textbox "Application code" Contains "MH99001" In The Accordion "Application codes"
        Then User Verifies The Textbox "Application title" Contains "Issue of warrant of arrest in commitment proceedings - council tax (bulk)" In The Accordion "Application codes"
        Then User Verifies The Date field "Lodgement date" Has Value "today"
        Then User Verifies Date Field "Lodgement date" Is Disabled In The Accordion "Application codes"
        # Verify Wording Details
        Then User Verifies The "Wording" Accordion Has Value "Attends to swear a complaint for the issue of warrants of arrest for the debtors to answer an application for committal to prison (number of cases"
        Then User Verifies Textbox With Placeholder "Enter a Number" Contains "10" In The Accordion "Wording"
        # Verify Respondent Details provided (as Bulk Application) even though Respondent Required = N as it is optional provide Respondent Details
        When User Verifies In The Respondent Details
            | Select type           | Bulk Application |
            | Number of respondents | 5                |
