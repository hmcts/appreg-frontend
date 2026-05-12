Feature: Application List Bulk Upload

    @applicationsList @ARCPOC-632
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
        When User Uploads The File "bulk-upload-entries.csv"
        When User Clicks On The "Upload file" Button
        Then User Sees Success Banner "Bulk upload complete"
        Then User Clicks On The Breadcrumb Link "Applications list details"
        Then User See "Applications" On The Page
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number   | Applicant                 | Respondent             | Postcode | Title                     | Fee | Resulted |
            | 1               | AC-BULK-TEST-001 | Benjamin Young            | Greenfield Finance Ltd | WS1 1SY  | Request to copy documents | No  |          |
            | 2               | AC-BULK-TEST-002 | Global Tech Solutions Ltd | James Hargreaves       | B1 1BB   | Request to copy documents | No  |          |
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | Status | Description     | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                         |
            | user1 | todayiso | timenowhhmm-2h | OPEN   | BulkUp_{RANDOM} | RCJ001            | today      | todaydisplay | 0       | Royal Courts of Justice Set 1 |
