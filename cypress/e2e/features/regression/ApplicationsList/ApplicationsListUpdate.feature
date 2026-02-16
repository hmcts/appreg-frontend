Feature: Applications List Update

    @regression @ARCPOC-214 @ARCPOC-450 @ARCPOC-799
    Scenario Outline: Update applications list Successfully with Other location and CJA selected
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | description   | status   | otherLocationDescription | cjaCode   | durationHours | durationMinutes |
            | <DisplayDate> | <Time> | <Description> | <Status> | <OtherLocation>          | <cjaCode> | <HH>          | <MM>            |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Enters "<Description>" Into The "Description" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location   | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Location> | <Description> | <Entries> | <Status> |
        Then User Should See The Link "List details"
        Then User Clicks On The Link "List details"
        Then User Verify The Page URL Contains "#list-details"
        Then User Verifies The Time field "Time" Has Value "<Time>"
        Then User Verifies The "Description" Textbox Has Value "<Description>"
        Then User Verifies "<Status>" Is Selected In The "Status" Dropdown
        Then User Verifies The "Court" Textbox Has Selected Value "<CourtValue>"
        Then User Verifies The "Other location" Textbox Has Value "<OtherLocation>"
        Then User Verifies The "CJA" Textbox Has Value "<CJAValue>"
        Then User Verifies The "Duration" field Has Values hours "<HH>" and minutes "<MM>"
        Then User Clears The "Description" Textbox
        Then User Enters "<UpdatedDescription>" Into The "Description" Textbox
        Then User Clears The "Other location" Textbox
        Then User Enters "<UpdatedOtherLocation>" Into The "Other location" Textbox
        When User Clicks On The "Update" Button
        # Then User Sees Notification Banner "Success Update complete List successfully updated"
        Examples:
            | User  | TableName | DisplayDate | Time  | Location      | Description   | Entries | Status | ButtonName | SearchDate | SelectButtonText | CourtValue | OtherLocation        | cjaCode | CJAValue           | HH | MM | UpdatedDescription    | UpdatedOtherLocation   |
            | user1 | Lists     | 2025-12-04  | 15:05 | Wolverhampton | Test_{RANDOM} | 0       | OPEN   | Open       | 04/12/2025 | Select           |            | Other Location_21442 | B9      | B9 - Wolverhampton | 11 | 30 | Updated Test_{RANDOM} | Updated Location_21442 |

    @regression @ARCPOC-214 @ARCPOC-450 @ARCPOC-799
    Scenario Outline: Update applications list Successfully with Court selected
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | description   | status   | courtLocationCode | durationHours | durationMinutes |
            | <DisplayDate> | <Time> | <Description> | <Status> | <Court>           | <HH>          | <MM>            |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Enters "<Description>" Into The "Description" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
        Then User Should See Table "<TableName>" Header "Actions" Is Not Sortable
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location        | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <CourtLocation> | <Description> | <Entries> | <Status> |
        Then User Should See The Link "List details"
        Then User Clicks On The Link "List details"
        Then User Verify The Page URL Contains "#list-details"
        Then User Verifies The Date field "Date" Has Value "<SearchDate>"
        Then User Verifies The Time field "Time" Has Value "<Time>"
        Then User Verifies The "Description" Textbox Has Value "<Description>"
        Then User Verifies "<Status>" Is Selected In The "Status" Dropdown
        Then User Verifies The "Court" Textbox Has Selected Value "<Court> - <CourtLocation>"
        Then User Verifies The "Other location" Textbox Has Value "<OtherLocation>"
        Then User Verifies The "CJA" Textbox Has Value "<CJAValue>"
        Then User Verifies The "Duration" field Has Values hours "<HH>" and minutes "<MM>"
        When User Set "<UpdatedHH>" and "<UpdatedMM>" In The "Duration" Field
        Then User Clears The "Description" Textbox
        Then User Enters "<UpdatedDescription>" Into The "Description" Textbox
        Then User Clears The "Court" Textbox
        Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
        When User Clicks On The "Update" Button
        #  A new bug ticket to be raised for the below issue where there are multiple notifications
        # Then User Sees Notification Banner "Success Update complete List successfully updated"
        Examples:
            | User  | TableName | DisplayDate | Time  | Court  | CourtLocation                 | Description   | Entries | Status | ButtonName | SearchDate | SelectButtonText | OtherLocation | CJAValue | HH | MM | UpdatedDescription           | OptionText                | SearchText | UpdatedHH | UpdatedMM |
            | user1 | Lists     | 2025-12-11  | 16:05 | RCJ001 | Royal Courts of Justice Set 1 | Test_{RANDOM} | 0       | OPEN   | Open       | 11/12/2025 | Select           |               |          | 11 | 30 | Updated Description For Test | Cardiff Crown Court Set 4 | CCC033     | 12        | 45        |

    @regression @ARCPOC-214 @ARCPOC-450 @ARCPOC-799
    Scenario Outline: Update applications list Successfully with Court selected and field validations
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | description   | status   | courtLocationCode | durationHours | durationMinutes |
            | <DisplayDate> | <Time> | <Description> | <Status> | <Court>           | <HH>          | <MM>            |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Enters "<Description>" Into The "Description" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location        | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <courtLocation> | <Description> | <Entries> | <Status> |
        Then User Should See The Link "List details"
        Then User Clicks On The Link "List details"
        Then User Verify The Page URL Contains "#list-details"
        Then User Verifies The Date field "Date" Has Value "<SearchDate>"
        Then User Verifies The Time field "Time" Has Value "<Time>"
        Then User Verifies The "Description" Textbox Has Value "<Description>"
        Then User Verifies "<Status>" Is Selected In The "Status" Dropdown
        Then User Verifies The "Court" Textbox Has Selected Value "<Court> - <courtLocation>"
        Then User Verifies The "Other location" Textbox Has Value "<OtherLocation>"
        Then User Verifies The "CJA" Textbox Has Value "<CJAValue>"
        Then User Verifies The "Duration" field Has Values hours "<HH>" and minutes "<MM>"
        When User Clears The Date Field "Date"
        When User Clicks On The "Update" Button
        Then User Sees Validation Error "There is a problem Enter day, month and year"
        When User Set Date Field "Date" To "<InvalidSearchDate>"
        When User Clicks On The "Update" Button
        Then User Sees Validation Error "There is a problem Enter a real date"
        When User Set Date Field "Date" To "<UpdatedSearchDate>"
        When User Clears The Time Field "Time"
        When User Clicks On The "Update" Button
        Then User Sees Validation Error "There is a problem Enter hours and minutes"
        When User Set Time Field "Time" To "<InvalidTime1>"
        When User Clicks On The "Update" Button
        Then User Sees Validation Error "There is a problem Enter minutes"
        When User Clears The Time Field "Time"
        When User Set Time Field "Time" To "<InvalidTime2>"
        When User Clicks On The "Update" Button
        Then User Sees Validation Error "There is a problem Enter hours"
        When User Set Time Field "Time" To "<InvalidTime3>"
        When User Clicks On The "Update" Button
        Then User Sees Validation Error "There is a problem Enter a valid duration between 00:00 and 23:59"
        When User Set Time Field "Time" To "<UpdatedTime>"
        Then User Clears The "Description" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Validation Error "There is a problem Description is required"
        Then User Enters "<UpdatedDescription>" Into The "Description" Textbox
        Then User Selects "<InvalidStatus>" In The "Status" Dropdown
        When User Clicks On The "Update" Button
        Then User Sees Validation Error "There is a problem Status is required"
        Then User Selects "<Status>" In The "Status" Dropdown
        When User Set "<InvalidHH>" and "<InvalidMM>" In The "Duration" Field
        When User Clicks On The "Update" Button
        Then User Sees Validation Error "There is a problem Enter hours between 0 and 99 Enter minutes between 0 and 59"
        When User Set "<UpdatedHH>" and "<UpdatedMM>" In The "Duration" Field
        Then User Clears The "Court" Textbox
        Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
        When User Clicks On The "Update" Button
        # Then User Sees Notification Banner "Success Update complete List successfully updated"
        Examples:
            | User  | TableName | DisplayDate | Time  | InvalidTime1 | InvalidTime2 | InvalidTime3 | UpdatedTime | Court  | courtLocation                 | Description   | Entries | InvalidStatus | Status | ButtonName | InvalidSearchDate | SearchDate | UpdatedSearchDate | SelectButtonText | OtherLocation | CJAValue | HH | MM | UpdatedDescription           | OptionText                | SearchText | InvalidHH | InvalidMM | UpdatedHH | UpdatedMM |
            | user1 | Lists     | 2025-12-11  | 16:05 | 44:*SKIP*    | *SKIP*:00    | 46:70        | 16:30       | RCJ001 | Royal Courts of Justice Set 1 | Test_11122025 | 0       | Choose status | OPEN   | Open       | 32/13/2025        | 11/12/2025 | 12/12/2025        | Select           |               |          | 11 | 30 | Updated Description For Test | Cardiff Crown Court Set 4 | CCC033     | A1        | C3        | 12        | 45        |

    @regression @ARCPOC-214 @ARCPOC-450 @ARCPOC-799 @ARCPOC-852
    Scenario Outline: Update applications list Successfully with Court selected and field validations for Other location and CJA
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | description   | status   | courtLocationCode | durationHours | durationMinutes |
            | <DisplayDate> | <Time> | <Description> | <Status> | <Court>           | <HH>          | <MM>            |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Enters "<Description>" Into The "Description" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location        | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <courtLocation> | <Description> | <Entries> | <Status> |
        Then User Should See The Link "List details"
        Then User Clicks On The Link "List details"
        Then User Verify The Page URL Contains "#list-details"
        Then User Verifies The Date field "Date" Has Value "<SearchDate>"
        Then User Verifies The Time field "Time" Has Value "<Time>"
        Then User Verifies The "Description" Textbox Has Value "<Description>"
        Then User Verifies "<Status>" Is Selected In The "Status" Dropdown
        Then User Verifies The "Court" Textbox Has Selected Value "<Court> - <courtLocation>"
        Then User Verifies The "Other location" Textbox Has Value "<OtherLocation>"
        Then User Verifies The "CJA" Textbox Has Value "<CJAValue>"
        Then User Verifies The "Duration" field Has Values hours "<HH>" and minutes "<MM>"
        When User Clears The Date Field "Date"
        When User Clears The Time Field "Time"
        Then User Clears The "Description" Textbox
        Then User Selects "<InvalidStatus>" In The "Status" Dropdown
        Then User Clears The "Court" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter day, month and year Enter hours and minutes Enter a description Select a status Court is required Other location is required CJA is required"
        When User Set Date Field "Date" To "<InvalidSearchDate>"
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter a valid date Enter hours and minutes Enter a description Select a status Court is required Other location is required CJA is required"
        When User Set Date Field "Date" To "<UpdatedSearchDate>"
        When User Set Time Field "Time" To "<InvalidTime1>"
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter minutes Enter a description Select a status Court is required Other location is required CJA is required"
        When User Clears The Time Field "Time"
        When User Set Time Field "Time" To "<InvalidTime2>"
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter hours Enter a description Select a status Court is required Other location is required CJA is required"
        When User Clears The Time Field "Time"
        When User Set Time Field "Time" To "<InvalidTime3>"
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter a valid duration between 00:00 and 23:59 Enter a description Select a status Court is required Other location is required CJA is required"
        When User Set Time Field "Time" To "<UpdatedTime>"
        Then User Enters "<UpdatedDescription>" Into The "Description" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Select a status Court is required Other location is required CJA is required"
        Then User Selects "<Status>" In The "Status" Dropdown
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Court is required Other location is required CJA is required"
        Then User Enters "<UpdatedOtherLocation>" Into The "Other location" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem CJA is required"
        Then User Enters "<InvalidCJAValue>" Into The "CJA" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "Criminal Justice Area not found"
        Then User Clears The "CJA" Textbox
        Then User Clears The "Other location" Textbox
        Then User Enters "<InvalidCourtValue>" Into The "Court" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "Court Location not found"
        Then User Clears The "Court" Textbox
        Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
        When User Set "<UpdatedHH>" and "<UpdatedMM>" In The "Duration" Field
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "Success Update complete List successfully updated"
        Examples:
            | User  | TableName | DisplayDate | Time  | InvalidTime1 | InvalidTime2 | InvalidTime3 | UpdatedTime | Court  | courtLocation                 | Description   | Entries | InvalidStatus | Status | ButtonName | InvalidSearchDate | SearchDate | UpdatedSearchDate | SelectButtonText | OtherLocation | cjaCode | CJAValue | HH | MM | UpdatedDescription           | OptionText                | SearchText | InvalidHH | InvalidMM | UpdatedHH | UpdatedMM | UpdatedOtherLocation      | InvalidCJAValue | InvalidCourtValue |
            | user1 | Lists     | 2025-12-11  | 16:05 | 44:*SKIP*    | *SKIP*:33    | 46:70        | 16:30       | RCJ001 | Royal Courts of Justice Set 1 | Test_11122025 | 0       | Choose status | OPEN   | Open       | 32/13/2025        | 11/12/2025 | 12/12/2025        | Select           |               |         |          | 11 | 30 | Updated Description For Test | Cardiff Crown Court Set 4 | CCC033     | A1B2      | C3D4      | 12        | 45        | Updated Location {RANDOM} | InvalidCJA      | InvalidCourt      |