Feature: Application List Bulk Upload

    @regression @applicationsList @applicationListEntry @ARCPOC-632 @ARCPOC-821 @ARCPOC-1500
    Scenario Outline: Application List - Bulk Upload Entries Via CSV File With Application Codes Fee Required = 'N'
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status   | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       | <Status> |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Clicks On The Link "Bulk upload"
        Then User See "Bulk upload applications" On The Page
        Then User See "Select the bulk applications file you wish to upload." On The Page
        When User Uploads The File "bulk-upload-entries-fee-not-required.csv"
        When User Clicks On The "Upload file" Button
        When User Waits For The File Upload To Complete
        Then User Sees Success Banner "Success Bulk upload complete All records were uploaded successfully." Containing Link "Click here to update fee details on newly uploaded applications"
        Then User See "Applications list" On The Page
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number | Applicant                 | Respondent                      | Postcode | Title                                            | Fee | Resulted |
            | 1               | AC-{RANDOM}-1  | Benjamin Young            | Greenfield Finance {RANDOM} Ltd | WS1 1SY  | Application to vary an overseas production order | No  |          |
            | 2               | AC-{RANDOM}-2  | Global Tech Solutions Ltd | James Hargreaves{RANDOM}        | B1 1BB   | Warrant of Control                               | No  |          |
        Then User Clicks On The Link "Click here to update fee details on newly uploaded applications"
        # Add Fee Details for Bulk Uploaded Application(s) where Fee Required = 'N'
        Then User Sees Validation Error Banner "There is a problem" Containing "Cannot update application(s) that do not require a fee"
        When User Verifies The Checkbox is Checked In Row Of Table "Entries" With Values:
            | Sequence number | Account number | Applicant                 | Respondent                      | Postcode | Title                                            | Fee | Resulted |
            | 1               | AC-{RANDOM}-1  | Benjamin Young            | Greenfield Finance {RANDOM} Ltd | WS1 1SY  | Application to vary an overseas production order | No  |          |
            | 2               | AC-{RANDOM}-2  | Global Tech Solutions Ltd | James Hargreaves{RANDOM}        | B1 1BB   | Warrant of Control                               | No  |          |
        Then User Should See The Button "Actions" Is Enabled
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | Status | Description     | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                         |
            | user1 | todayiso | timenowhhmm-2h | OPEN   | BulkUp_{RANDOM} | RCJ001            | today      | todaydisplay | 0       | Royal Courts of Justice Set 1 |

    @regression @applicationsList @applicationListEntry @ARCPOC-632 @ARCPOC-821 @ARCPOC-1500 @ARCPOC-1493
    Scenario Outline: Application List - Bulk Upload Entries Via CSV File With Application Codes Fee Required = 'Y'
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status   | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       | <Status> |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Clicks On The Link "Bulk upload"
        Then User See "Bulk upload applications" On The Page
        Then User See "Select the bulk applications file you wish to upload." On The Page
        When User Uploads The File "bulk-upload-entries-fee-required.csv"
        When User Clicks On The "Upload file" Button
        When User Waits For The File Upload To Complete
        Then User Sees Success Banner "Success Bulk upload complete All records were uploaded successfully." Containing Link "Click here to update fee details on newly uploaded applications"
        Then User See "Applications list" On The Page
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number | Applicant                 | Respondent                      | Postcode | Title                                  | Fee | Resulted |
            | 1               | AC-{RANDOM}-1  | Benjamin Young            | Globex Corporation {RANDOM} Ltd | WS1 1SY  | Rights of Entry Warrant - Gas Operator | Yes |          |
            | 2               | AC-{RANDOM}-2  | Global Tech Solutions Ltd | John Hargreaves{RANDOM}         | B1 1BB   | Warrant of Control                     | No  |          |
        Then User Clicks On The Link "Click here to update fee details on newly uploaded applications"
        # Add Fee Details for Bulk Uploaded Application(s) where Fee Required = 'Y'
        Then User Sees Page Heading "Update fee details"
        And User Should See Row In Table "Updating fees for the following application(s)" With Values:
            | Applicant      | Respondent                      | Application title                      | Fee required | Resulted |
            | Benjamin Young | Globex Corporation {RANDOM} Ltd | Rights of Entry Warrant - Gas Operator | Yes          |          |
        Then User Should See The Button "Update fee details" Is Disabled
        When User Checks The Checkbox With Label "Off site fee applies"
        Then User Should See The Button "Update fee details" Is Enabled
        Then User See "Selecting this will apply the off site fee to the entry." On The Page
        And User See "No fees exist" On The Page
        And User See "Update fee status" On The Page
        Then User Selects "Paid" In The "Fee status" Dropdown
        When User Set Date Field "Status date" To "<SearchDate>"
        Then User Enters "BUldFee{RANDOM}" Into The "Payment reference" Textbox
        When User Clicks On The "Add fee details" Button
        When User Clicks On The "Update fee details" Button
        Then User See "Are you sure you want to add these fees to the following applications?" On The Page
        When User Clicks On The "Continue" Button
        Then User Sees Success Banner "Fees updated" Containing "Fees have been successfully updated"
        When User Clicks "Open" Button In Row Of Table "Entries" With:
            | Sequence number | Account number | Applicant      | Respondent                      | Postcode | Title                                  | Fee | Resulted |
            | 1               | AC-{RANDOM}-1  | Benjamin Young | Globex Corporation {RANDOM} Ltd | WS1 1SY  | Rights of Entry Warrant - Gas Operator | Yes |          |
        Then User Sees Page Heading "Applications list entry update"
        When User Clicks On The "Show all sections" Button
        Then User Should See Row In Table "Current fee statuses table" In The Accordion "Civil fee" With Values:
            | Fee Status | Status Date  | Payment Ref     |
            | PAID       | todaydisplay | BUldFee{RANDOM} |
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | Status | Description     | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                         |
            | user1 | todayiso | timenowhhmm-2h | OPEN   | BulkUp_{RANDOM} | RCJ001            | today      | todaydisplay | 0       | Royal Courts of Justice Set 1 |

    @regression @applicationsList @applicationListEntry @ARCPOC-632
    Scenario Outline: Application List - Bulk Upload Fails With Invalid CSV Headers
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status   | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       | <Status> |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Clicks On The Link "Bulk upload"
        Then User See "Bulk upload applications" On The Page
        When User Uploads The File "sample.txt"
        Then User Sees Validation Error Banner "There is a problem" Containing "Please upload a valid CSV file."
        # Then User See "Please upload a valid CSV file." On The Page
        When User Uploads The File "bulk-upload-wrong-headers.csv"
        When User Clicks On The "Upload file" Button
        Then User Sees Validation Error Banner "There is a problem" Containing "Uploaded file must be a valid CSV file"
        # Then User See "Uploaded file must be a valid CSV file" On The Page
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | Status | Description       | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                         |
            | user1 | todayiso | timenowhhmm-2h | OPEN   | BulkFail_{RANDOM} | RCJ001            | today      | todaydisplay | 0       | Royal Courts of Justice Set 1 |

    @applicationsList @applicationListEntry @ARCPOC-1502 @ARCPOC-1563
    Scenario Outline: Application List - Bulk Upload Fails - Verify CSV Import Error Table
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status   | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       | <Status> |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Clicks On The Link "Bulk upload"
        Then User See "Bulk upload applications" On The Page
        When User Uploads The File "bulk-upload-invalid-values-one-header-per-row.csv"
        When User Clicks On The "Upload file" Button
        When User Waits For The File Upload To Complete
        Then User Sees Validation Error Banner "Bulk upload failed" Containing "The bulk upload could not be completed. See the table below for more details. Please re-try the upload once these errors have been resolved"
        Then User Should See Row In Table "Import errors table" With Values:
            | Error Type | Row | Affected column | Message | Applicant name | Address line 1 | Rejected value |
