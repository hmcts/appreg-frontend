Feature: Application List Bulk Upload

    @regression @applicationsList @applicationListEntry @ARCPOC-632 @ARCPOC-821
    Scenario Outline: Application List - Bulk Upload Entries Via CSV
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
        Then User See "Bulk Upload Applications" On The Page
        Then User See "Select the bulk applications file you wish to upload." On The Page
        Then User See "the file must match the current template for bulk uploads." On The Page
        Then User See "the filename must end in .csv" On The Page
        When User Uploads The File "bulk-upload-entries.csv"
        When User Clicks On The "Upload file" Button
        When User Waits For The File Upload To Complete
        Then User Sees Success Banner "Bulk upload complete All records were uploaded successfully."
        Then User See "Applications List" On The Page
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number | Applicant                 | Respondent                      | Postcode | Title                                            | Fee | Resulted |
            | 1               | AC-{RANDOM}-1  | Benjamin Young            | Greenfield Finance {RANDOM} Ltd | WS1 1SY  | Application to vary an overseas production order | No  |          |
            | 2               | AC-{RANDOM}-2  | Global Tech Solutions Ltd | James Hargreaves{RANDOM}        | B1 1BB   | Warrant of Control                               | No  |          |
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
        Then User See "Bulk Upload Applications" On The Page
        When User Uploads The File "sample.txt"
        Then User Sees Validation Error Banner "There is a problem"
        Then User See "Please upload a valid CSV file." On The Page
        When User Uploads The File "bulk-upload-wrong-headers.csv"
        When User Clicks On The "Upload file" Button
        When User Waits For The File Upload To Complete
        Then User Sees Validation Error Banner "Bulk upload failed"
        Then User See "The bulk upload could not be completed." On The Page
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | Status | Description       | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                         |
            | user1 | todayiso | timenowhhmm-2h | OPEN   | BulkFail_{RANDOM} | RCJ001            | today      | todaydisplay | 0       | Royal Courts of Justice Set 1 |
