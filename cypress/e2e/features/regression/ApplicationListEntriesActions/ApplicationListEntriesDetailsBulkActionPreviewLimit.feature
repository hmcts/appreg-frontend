Feature: Application List Entries Details Bulk Action Preview Limit Validation

    @regression @applicationsList @applicationListEntry @ARCPOC-222 @ARCPOC-1513
    Scenario Outline: Verify Validation Error Message For Application List Entries Details Bulk Action Preview Limit
        Given User Authenticates Via API As "user1"
        When User Makes POST API Request To "/application-lists" With Object Builder:
            | date              | todayiso                          |
            | time              | timenowhhmm-2h                    |
            | status            | OPEN                              |
            | description       | Test Data List 1051 ALEs {SCENARIO_ID} |
            | courtLocationCode | LCCC065                           |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Signs In With Microsoft SSO As "user1"
        When User Searches Application List With:
            | Date  | Time | Description                       | CourtSearch | Court | Status | Other location | CJA | CJASearch |
            | today |      | Test Data List 1051 ALEs {SCENARIO_ID} |             |       | OPEN   |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date         | Time           | Location                          | Description                       | Entries | Status |
            | todaydisplay | timenowhhmm-2h | Leeds Combined Court Centre Set 7 | Test Data List 1051 ALEs {SCENARIO_ID} | 0       | OPEN   |
        Then User See "Applications" On The Page
        Then User Clicks On The Link "Bulk upload"
        Then User See "Bulk upload applications" On The Page
        When User Uploads The File "bulk-upload-entries-preview-limit.csv"
        When User Clicks On The "Upload file" Button
        When User Waits For The File Upload To Complete
        Then User Sees Success Banner "Success Bulk upload complete All records were uploaded successfully." Containing Link "Click here to update fee details on newly uploaded applications"
        Then User See "Applications list" On The Page
        Then User Clicks On The Breadcrumb Link "Applications list"
        When User Searches Application List With:
            | Date  | Time | Description                       | CourtSearch | Court | Status | Other location | CJA | CJASearch |
            | today |      | Test Data List 1051 ALEs {SCENARIO_ID} |             |       | OPEN   |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date         | Time           | Location                          | Description                       | Status |
            | todaydisplay | timenowhhmm-2h | Leeds Combined Court Centre Set 7 | Test Data List 1051 ALEs {SCENARIO_ID} | OPEN   |
        Then User Should See The Table "Entries"
        # Action - Result Selected
        When User Checks The Select All Checkbox In Table "Entries"
        When User Clicks "Actions" Then "Result selected" From Caption Menu In Table "Entries"
        Then User Sees Validation Error Banner "There is a problem Affected rows exceeds 1050. Please reduce the number of rows selected"
        # Action - Move Entries
        When User Checks The Select All Checkbox In Table "Entries"
        When User Clicks "Actions" Then "Move entries" From Caption Menu In Table "Entries"
        Then User Sees Validation Error Banner "There is a problem Affected rows exceeds 1050. Please reduce the number of rows selected"
        # Action - Update officials
        When User Checks The Select All Checkbox In Table "Entries"
        When User Clicks "Actions" Then "Update officials" From Caption Menu In Table "Entries"
        Then User Sees Validation Error Banner "There is a problem Affected rows exceeds 1050. Please reduce the number of rows selected"
        # Action - Update fee details
        When User Checks The Select All Checkbox In Table "Entries"
        When User Clicks "Actions" Then "Update fee details" From Caption Menu In Table "Entries"
        Then User Sees Validation Error Banner "There is a problem Affected rows exceeds 1050. Please reduce the number of rows selected"
        # Action - Print continuous
        When User Checks The Select All Checkbox In Table "Entries"
        When User Clicks "Actions" Then "Print continuous" From Caption Menu In Table "Entries"
        Then User Sees Validation Error Banner "There is a problem Affected rows exceeds 1050. Please reduce the number of rows selected"
        # Action - Print page
        When User Checks The Select All Checkbox In Table "Entries"
        When User Clicks "Actions" Then "Print page" From Caption Menu In Table "Entries"
        Then User Sees Validation Error Banner "There is a problem Affected rows exceeds 1050. Please reduce the number of rows selected"
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
