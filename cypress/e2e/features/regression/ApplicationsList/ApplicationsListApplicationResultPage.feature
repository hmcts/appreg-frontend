Feature: Applications List Result

    @regression @ARCPOC-965
    Scenario Outline: Result selected button is enabled when an application list entry is selected
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
        Then User Should See The Button "Result selected" Is Disabled
        When User Clicks On The Checkbox In Row <RowNumber>
        Then User Should See The Button "Result selected" Is Enabled
        Examples:
            | User  | TableName | DisplayDate | Time  | Location                      | Description                           | Entries | Status | ButtonName | SearchDate | SelectButtonText | RowNumber | OtherLocation        | cjaCode | CJAValue           | HH | MM |
            | user1 | Lists     | 2025-12-09  | 12:58 | Royal Courts of Justice Set 1 | Test_16210 for Applications to review | 63      | OPEN   | Open       | 09/12/2025 | Select           | 1         | Other Location_21442 | B9      | B9 - Wolverhampton | 11 | 30 |