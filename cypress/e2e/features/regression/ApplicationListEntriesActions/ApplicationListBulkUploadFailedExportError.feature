Feature: Application List - Export Failed Bulk Upload With Original Data And Validation Errors

    @regression @applicationsList @applicationListEntry @ARCPOC-1506
    Scenario Outline: Application List - Export Multiple Bulk Upload Validation Errors For Modernised Respondent Data Row Values
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
        Then User Clears Downloaded CSVs
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status   | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       | <Status> |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Clicks On The Link "Bulk upload"
        Then User See "Bulk upload applications" On The Page
        # Export is unavailable before validation errors exist
        Then User Should Not See The Button "Export the file with errors shown"
        # Upload Invalid CSV
        Given User Has No Downloaded CSVs
        When User Uploads The File "bulk-upload-modernised-invalid-data-row-values.csv"
        When User Clicks On The "Upload file" Button
        When User Waits For The File Upload To Complete
        Then User Sees Validation Error Banner "Bulk upload failed" Containing "The bulk upload could not be completed. See the table below for more details. Please re-try the upload once these errors have been resolved"
        # Verify Error Details (Add all the rows from the CSV to the table)
        Then User Should See Row In Table With Values:
            | Error type | Row | Affected column         | Message                    | Applicant | Address line 1              | Rejected value |
            | Data error | 2   | Standard applicant code | Applicant code is required | —         | Organisation Address Line 1 | —              |
        Then User Should See The Button "Export the file with errors shown" Is Enabled
        Given User Has No Downloaded CSVs
        # Export Bulk Upload Errors
        When User Clicks On The "Export the file with errors shown" Button
        # Verify Download And Filename
        Then User Verifies CSV "bulk-upload-export-error-csv" Is Downloaded
        Then User Verifies Latest Downloaded CSV Contains Text "APPLICANT_CODE" In Row 1
        Then User Verifies Latest Downloaded CSV Contains Text "APPLICATION_CODE" In Row 1
        Then User Verifies Latest Downloaded CSV Contains Text "BAD@CODE" In Row 3
        Then User Verifies Latest Downloaded CSV Contains Text "BAD@123" In Row 6
        Then User Verifies Latest Downloaded CSV Contains Text "SW1A1AA" In Row 16
        # Verify all original columns and appended validation details
        Then User Verifies Latest Downloaded CSV Contains All Columns From Fixture "bulk-upload-modernised-invalid-data-row-values.csv" In Row 1 Using Delimiter "|"
        Then User Verifies Latest Downloaded CSV Retains All Original Data From Fixture "bulk-upload-modernised-invalid-data-row-values.csv" Using Delimiter "|"
        Then User Verifies Latest Downloaded CSV Using Delimiter "|" Contains Validation Errors:
            | Source row | Validation error                                     |
            | 20         | email - invalid.example.com: Field has been rejected |
            | 20         | applicationCode: No valid code can be found CT99005  |
        # Cleanup
        Then User Clears Downloaded CSVs
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"

        Examples:
            | User  | APIDate  | Time           | Status | Description         | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                         |
            | user1 | todayiso | timenowhhmm-2h | OPEN   | BulkExport_{SCENARIO_ID} | RCJ001            | today      | todaydisplay | 0       | Royal Courts of Justice Set 1 |
