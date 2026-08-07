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
        # Export must not be offered when there are no validation errors
        Then User Should Not See The Button "Export the file with errors shown"
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
        # Export must not be offered when there are no validation errors
        Then User Should Not See The Button "Export the file with errors shown"
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
        # File other than Pipe Seperated CSV is uploaded and validation error is displayed
        When User Uploads The File "sample.txt"
        Then User Sees Validation Error Banner "There is a problem" Containing "Please upload a valid CSV file."
        # File with No headers is uploaded and validation error is displayed
        When User Uploads The File "bulk-upload-entries_FileWithNoHeaders.csv"
        When User Clicks On The "Upload file" Button
        Then User Sees Validation Error Banner "There is a problem" Containing "Uploaded file must be a valid CSV file"
        # File with wrong headers is uploaded and validation error is displayed
        When User Uploads The File "bulk-upload-wrong-headers.csv"
        When User Clicks On The "Upload file" Button
        Then User Sees Validation Error Banner "There is a problem" Containing "Uploaded file must be a valid CSV file"
        # File with Invalid Delimiter is uploaded and validation error is displayed
        When User Uploads The File "bulk-upload-entries_Invalid_delimiter.csv"
        When User Clicks On The "Upload file" Button
        Then User Sees Validation Error Banner "There is a problem" Containing "Uploaded file must be a valid CSV file"
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | Status | Description       | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                         |
            | user1 | todayiso | timenowhhmm-2h | OPEN   | BulkFail_{RANDOM} | RCJ001            | today      | todaydisplay | 0       | Royal Courts of Justice Set 1 |

    @regression @applicationsList @applicationListEntry @ARCPOC-1502 @ARCPOC-1563 @ARCPOC-1506
    Scenario Outline: Application List - Bulk Upload Fails - Verify CSV Import Error Table
        # Application List Setup
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Navigate To Bulk Upload
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
        # Upload Invalid CSV And Wait For Validation Failure
        Given User Has No Downloaded CSVs
        When User Uploads The File "bulk-upload-invalid-values-one-header-per-row.csv"
        When User Clicks On The "Upload file" Button
        When User Waits For The File Upload To Complete
        Then User Sees Validation Error Banner "Bulk upload failed" Containing "The bulk upload could not be completed. See the table below for more details. Please re-try the upload once these errors have been resolved"
        # Verify Error Table Details (Pagination is disabled)
        Then User Should See Row In Table With Values:
            | Error type | Row | Affected column | Message                       | Applicant    | Address line 1  | Rejected value |
            | Data error | 2   | applicationCode | size must be between 1 and 10 | Bad Row null | 1 Broken Street | APP-INVALID    |
        # Export Failed Upload CSV
        Then User Should See The Button "Export the file with errors shown" Is Enabled
        When User Clicks On The "Export the file with errors shown" Button
        Then User Verifies CSV "bulk-upload-export-error-csv" Is Downloaded
        Then User Verifies Latest Downloaded CSV Contains Text "APPLICANT_CODE" In Row 1
        Then User Verifies Latest Downloaded CSV Contains Text "APP/012" In Row 2
        Then User Clears Downloaded CSVs
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | Status | Description            | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                         |
            | user1 | todayiso | timenowhhmm-2h | OPEN   | BulkFailTable_{RANDOM} | RCJ001            | today      | todaydisplay | 0       | Royal Courts of Justice Set 1 |

    @regression @applicationsList @applicationListEntry @ARCPOC-1502
    Scenario: Application List - Bulk Upload Fails - Verify CSV Import Error Table With Pagination Enabled and Sorting Functionality
        # Application List Setup
        Given User Authenticates Via API As "user1"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                   | courtLocationCode |
            | todayiso | timenowhhmm-2h | OPEN   | BulkFailSortingTable_{RANDOM} | RCJ001            |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Navigate To Bulk Upload
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        When User Searches Application List With:
            | Date  | Time | Description                   | CourtSearch | Court | Status | Other location | CJA | CJASearch |
            | today |      | BulkFailSortingTable_{RANDOM} |             |       | OPEN   |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date         | Time           | Location                      | Description                   | Entries | Status |
            | todaydisplay | timenowhhmm-2h | Royal Courts of Justice Set 1 | BulkFailSortingTable_{RANDOM} | 0       | OPEN   |
        Then User See "Applications" On The Page
        Then User Clicks On The Link "Bulk upload"
        Then User See "Bulk upload applications" On The Page
        # Upload Invalid CSV And Wait For Validation Failure
        Given User Has No Downloaded CSVs
        When User Uploads The File "bulk-upload-modernised-invalid-data-row-values.csv"
        When User Clicks On The "Upload file" Button
        When User Waits For The File Upload To Complete
        Then User Sees Validation Error Banner "Bulk upload failed" Containing "The bulk upload could not be completed. See the table below for more details. Please re-try the upload once these errors have been resolved"
        Then User Should See Table "Error table" Has Sortable Headers "Error type, Row, Affected column, Message, Applicant, Address line 1, Rejected value"
        #Search for a specific row details in the error table and verify the values (Pagination is enabled)
        Then User Should See Row In Table "Error table" With Values:
            | Error type | Row | Affected column  | Message                 | Applicant | Address line 1              | Rejected value |
            | Data error | 23  | Respondent email | Field has been rejected | APP024    | Organisation Address Line 1 | @example.com   |
        # Verify default sort order
        Then User Should See Table "Error table" Header "Error type" Has Sort Order "none"
        Then User Should See Table "Error table" Header "Row" Has Sort Order "none"
        Then User Should See Table "Error table" Header "Affected column" Has Sort Order "none"
        Then User Should See Table "Error table" Header "Message" Has Sort Order "none"
        Then User Should See Table "Error table" Header "Applicant" Has Sort Order "none"
        Then User Should See Table "Error table" Header "Address line 1" Has Sort Order "none"
        Then User Should See Table "Error table" Header "Rejected value" Has Sort Order "none"
        # Test Error type column
        When User Goes To Next Page
        When User Clicks On Table Header "Error type" In Table "Error table"
        When User Is On First Page
        Then User Should See Table "Error table" Header "Error type" Has Sort Order "ascending"
        Then User Should See Table "Error table" Column "Error type" Is Sorted "ascending"
        When User Clicks On Table Header "Error type" In Table "Error table"
        Then User Should See Table "Error table" Header "Error type" Has Sort Order "descending"
        Then User Should See Table "Error table" Column "Error type" Is Sorted "descending"
        # Test Row column
        When User Clicks On Table Header "Row" In Table "Error table"
        Then User Should See Table "Error table" Header "Row" Has Sort Order "ascending"
        Then User Should See Table "Error table" Column "Row" Is Sorted "ascending"
        When User Clicks On Table Header "Row" In Table "Error table"
        Then User Should See Table "Error table" Header "Row" Has Sort Order "descending"
        Then User Should See Table "Error table" Column "Row" Is Sorted "descending"
        # Test Affected column
        When User Clicks On Table Header "Affected column" In Table "Error table"
        Then User Should See Table "Error table" Column "Affected column" Is Sorted "ascending"
        When User Clicks On Table Header "Affected column" In Table "Error table"
        Then User Should See Table "Error table" Column "Affected column" Is Sorted "descending"
        # Test Message column
        When User Clicks On Table Header "Message" In Table "Error table"
        Then User Should See Table "Error table" Header "Message" Has Sort Order "ascending"
        Then User Should See Table "Error table" Column "Message" Is Sorted "ascending"
        When User Clicks On Table Header "Message" In Table "Error table"
        Then User Should See Table "Error table" Header "Message" Has Sort Order "descending"
        Then User Should See Table "Error table" Column "Message" Is Sorted "descending"
        # Test Applicant column
        When User Clicks On Table Header "Applicant" In Table "Error table"
        Then User Should See Table "Error table" Header "Applicant" Has Sort Order "ascending"
        Then User Should See Table "Error table" Column "Applicant" Is Sorted "ascending"
        When User Clicks On Table Header "Applicant" In Table "Error table"
        Then User Should See Table "Error table" Header "Applicant" Has Sort Order "descending"
        Then User Should See Table "Error table" Column "Applicant" Is Sorted "descending"
        # Test Address line 1 column
        When User Clicks On Table Header "Address line 1" In Table "Error table"
        Then User Should See Table "Error table" Header "Address line 1" Has Sort Order "ascending"
        Then User Should See Table "Error table" Column "Address line 1" Is Sorted "ascending"
        When User Clicks On Table Header "Address line 1" In Table "Error table"
        Then User Should See Table "Error table" Header "Address line 1" Has Sort Order "descending"
        Then User Should See Table "Error table" Column "Address line 1" Is Sorted "descending"
        # Test Rejected value column
        When User Clicks On Table Header "Rejected value" In Table "Error table"
        Then User Should See Table "Error table" Header "Rejected value" Has Sort Order "ascending"
        Then User Should See Table "Error table" Column "Rejected value" Is Sorted "ascending"
        When User Clicks On Table Header "Rejected value" In Table "Error table"
        Then User Should See Table "Error table" Header "Rejected value" Has Sort Order "descending"
        Then User Should See Table "Error table" Column "Rejected value" Is Sorted "descending"
        # cleanup listId
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"

    @regression @applicationsList @applicationListEntry @ARCPOC-1502
    Scenario: Application List - Bulk Upload Fails - Display a header-level validation error and Identify all Validation error for a single row in the CSV file
        # Application List Setup
        Given User Authenticates Via API As "user1"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                   | courtLocationCode |
            | todayiso | timenowhhmm-2h | OPEN   | BulkFailSortingTable_{RANDOM} | RCJ001            |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Navigate To Bulk Upload
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        When User Searches Application List With:
            | Date  | Time | Description                   | CourtSearch | Court | Status | Other location | CJA | CJASearch |
            | today |      | BulkFailSortingTable_{RANDOM} |             |       | OPEN   |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date         | Time           | Location                      | Description                   | Entries | Status |
            | todaydisplay | timenowhhmm-2h | Royal Courts of Justice Set 1 | BulkFailSortingTable_{RANDOM} | 0       | OPEN   |
        Then User See "Applications" On The Page
        Then User Clicks On The Link "Bulk upload"
        Then User See "Bulk upload applications" On The Page
        # Upload Invalid CSV And Wait For Validation Failure
        Given User Has No Downloaded CSVs
        When User Uploads The File "bulk-upload-modernised-with-header-error.csv"
        When User Clicks On The "Upload file" Button
        When User Waits For The File Upload To Complete
        Then User Sees Validation Error Banner "Bulk upload failed" Containing "The bulk upload could not be completed. See the table below for more details. Please re-try the upload once these errors have been resolved"
        Then User Should See Table "Error table" Has Sortable Headers "Error type, Row, Affected column, Message, Applicant, Address line 1, Rejected value"
        #Header error
        Then User Should See Row In Table "Error table" With Values:
            | Error type   | Row | Affected column | Message                                                 | Applicant | Address line 1 | Rejected value |
            | Header error | -1  | BULK_UPLOAD_ROW | Number of data fields does not match number of headers. | —         | —              | —              |
        # Identify all Validation error for a single row
        Then User Should See Row In Table "Error table" With Values:
            | Error type | Row | Affected column  | Message                       | Applicant | Address line 1 | Rejected value |
            | Data error | 3   | Application code | Application code is required  | APP001    | 1 Main Street  | —              |
            | Data error | 3   | Application code | size must be between 1 and 10 | APP001    | 1 Main Street  | —              |
            | Data error | 3   | Application code | No valid code can be found    | APP001    | 1 Main Street  | —              |
        # cleanup listId
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"


