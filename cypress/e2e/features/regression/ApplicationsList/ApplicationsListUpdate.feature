Feature: Applications List Update

    @regression @ARCPOC-214 @ARCPOC-450 @ARCPOC-799 @tp
    Scenario Outline: Update applications list Successfully with Other location and CJA selected
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | description   | status   | otherLocationDescription | cjaCode   | durationHours | durationMinutes |
            | <APIDate> | <Time> | <Description> | <Status> | <OtherLocation>          | <cjaCode> | <HH>          | <MM>            |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       |        |                |     |           |
        When User Clicks "<SelectButtonText>" Then "Open" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location   | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Location> | <Description> | <Entries> | <Status> |
        Then User Clicks On The Link "List details"
        Then User Verify The Page URL Contains "#list-details"
        Then User Verifies The Time field "Time" Has Value "<Time>"
        Then User Verifies The "Description" Textbox Has Value "<Description>"
        Then User Verifies "<Status>" Is Selected In The "Select list status" Dropdown
        Then User Verifies The "Court" Textbox Has Selected Value "<CourtValue>"
        Then User Verifies The "Other location" Textbox Has Value "<OtherLocation>"
        Then User Verifies The "Criminal justice area" Textbox Has Value "<cjaCode> - <CJAValue>"
        Then User Verifies The "Duration" field Has Values hours "<HH>" and minutes "<MM>"
        Then User Clears The "Description" Textbox
        Then User Enters "<UpdatedDescription>" Into The "Description" Textbox
        Then User Clears The "Other location" Textbox
        Then User Enters "<UpdatedOtherLocation>" Into The "Other location" Textbox
        Then User Selects "<CJAValue>" From The Textbox "Criminal justice area" Autocomplete By Typing "<cjaCode>"
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "Success Update completeList successfully updated"
        Then User Clicks On The Breadcrumb Link "Applications list"
        When User Clicks "<SelectButtonText>" Then "Delete" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location   | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <CJAValue> | <Description> | <Entries> | <Status> |
        Then User Sees Notification Banner "You are about to delete this Application List and all of the Application List Entries. This action cannot be undone."
        Then User See "Are you sure you want to delete this application list?" On The Page
        When User Clicks On The "Yes - delete" Button
        Then User Sees Page Heading "Applications List"
        Then User Sees Notification Banner "Success Application List deleted successfully If you believe this was in error, please contact support."
        Examples:
            | User  | TableName | SearchDate | APIDate  | DisplayDate  | Time           | Location      | Description   | Entries | Status | SelectButtonText | CourtValue | OtherLocation        | cjaCode | CJAValue      | HH | MM | UpdatedDescription    | UpdatedOtherLocation   |
            | user1 | Lists     | today      | todayiso | todaydisplay | timenowhhmm-3h | Wolverhampton | Test_{RANDOM} | 0       | OPEN   | Select           |            | Other Location_21442 | B9      | Wolverhampton | 11 | 30 | Updated Test_{RANDOM} | Updated Location_21442 |

    @regression @ARCPOC-214 @ARCPOC-450 @ARCPOC-799
    Scenario Outline: Update applications list Successfully with Court selected
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | description   | status   | courtLocationCode | durationHours | durationMinutes |
            | <APIDate> | <Time> | <Description> | <Status> | <Court>           | <HH>          | <MM>            |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       |        |                |     |           |
        When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location        | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <CourtLocation> | <Description> | <Entries> | <Status> |
        Then User Should See The Link "List details"
        Then User Clicks On The Link "List details"
        Then User Verify The Page URL Contains "#list-details"
        Then User Verifies The Date field "Date" Has Value "<SearchDate>"
        Then User Verifies The Time field "Time" Has Value "<Time>"
        Then User Verifies The "Description" Textbox Has Value "<Description>"
        Then User Verifies "<Status>" Is Selected In The "Select list status" Dropdown
        Then User Verifies The "Court" Textbox Has Selected Value "<Court> - <CourtLocation>"
        Then User Verifies The "Other location" Textbox Has Value "<OtherLocation>"
        Then User Verifies The "Criminal justice area" Textbox Has Value "<CJAValue>"
        Then User Verifies The "Duration" field Has Values hours "<HH>" and minutes "<MM>"
        When User Set "<UpdatedHH>" and "<UpdatedMM>" In The "Duration" Field
        Then User Clears The "Description" Textbox
        Then User Enters "<UpdatedDescription>" Into The "Description" Textbox
        Then User Clears The "Court" Textbox
        Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "Success Update completeList successfully updated"
        Then User Clicks On The Breadcrumb Link "Applications list"
        When User Clicks "<SelectButtonText>" Then "Delete" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location        | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <CourtLocation> | <Description> | <Entries> | <Status> |
        Then User Sees Notification Banner "You are about to delete this Application List and all of the Application List Entries. This action cannot be undone."
        Then User See "Are you sure you want to delete this application list?" On The Page
        When User Clicks On The "Yes - delete" Button
        Then User Sees Page Heading "Applications List"
        Then User Sees Notification Banner "Success Application List deleted successfully If you believe this was in error, please contact support."
        Examples:
            | User   | TableName | SearchDate | APIDate  | DisplayDate  | Time           | Court  | CourtLocation                 | Description   | Entries | Status | ButtonName | SelectButtonText | OtherLocation | CJAValue | HH | MM | UpdatedDescription           | OptionText                | SearchText | UpdatedHH | UpdatedMM |
            | admin1 | Lists     | today      | todayiso | todaydisplay | timenowhhmm-3h | RCJ001 | Royal Courts of Justice Set 1 | Test_{RANDOM} | 0       | OPEN   | Open       | Select           |               |          | 11 | 30 | Updated Description For Test | Cardiff Crown Court Set 4 | CCC033     | 12        | 45        |

    @regression @ARCPOC-214 @ARCPOC-450 @ARCPOC-799 @ARCPOC-852
    Scenario Outline: Update applications list Successfully with field validations
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | description   | status   | courtLocationCode | durationHours | durationMinutes |
            | <APIDate> | <Time> | <Description> | <Status> | <Court>           | <HH>          | <MM>            |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       |        |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location        | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <courtLocation> | <Description> | <Entries> | <Status> |
        Then User Clicks On The Link "List details"
        Then User Verify The Page URL Contains "#list-details"
        Then User Verifies The Date field "Date" Has Value "<SearchDate>"
        Then User Verifies The Time field "Time" Has Value "<Time>"
        Then User Verifies The "Description" Textbox Has Value "<Description>"
        Then User Verifies "<Status>" Is Selected In The " Select list status " Dropdown
        Then User Verifies The "Court" Textbox Has Selected Value "<Court> - <courtLocation>"
        Then User Verifies The "Other location" Textbox Has Value "<OtherLocation>"
        Then User Verifies The "Criminal justice area" Textbox Has Value "<CJAValue>"
        Then User Verifies The "Duration" field Has Values hours "<HH>" and minutes "<MM>"
        When User Clears The Date Field "Date"
        When User Clears The Time Field "Time"
        Then User Clears The "Description" Textbox
        Then User Selects "<InvalidStatus>" In The "Select list status" Dropdown
        Then User Clears The "Court" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter day, month and year Enter valid hours and minutes Enter a description Select a status Enter a court, or an other location and criminal justice area"
        When User Set Date Field "Date" To "<InvalidSearchDate>"
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter a valid date Enter valid hours and minutes Enter a description Select a status Enter a court, or an other location and criminal justice area"
        When User Set Date Field "Date" To "<UpdatedSearchDate>"
        When User Set Time Field "Time" To "<InvalidTime1>"
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter valid hours and minutes Enter a description Select a status Enter a court, or an other location and criminal justice area"
        When User Clears The Time Field "Time"
        When User Set Time Field "Time" To "<InvalidTime2>"
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter valid hours and minutes Enter a description Select a status Enter a court, or an other location and criminal justice area"
        When User Clears The Time Field "Time"
        When User Set Time Field "Time" To "<InvalidTime3>"
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter a valid duration between 00:00 and 23:59 Enter a description Select a status Enter a court, or an other location and criminal justice area"
        When User Set Time Field "Time" To "<UpdatedTime>"
        Then User Enters "<UpdatedDescription>" Into The "Description" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Select a status Enter a court, or an other location and criminal justice area"
        Then User Selects "<Status>" In The "Select list status" Dropdown
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter a court, or an other location and criminal justice area"
        Then User Enters "<UpdatedOtherLocation>" Into The "Other location" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Enter a court, or an other location and criminal justice area"
        Then User Enters "<InvalidCJAValue>" Into The "Criminal justice area" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Criminal justice area not found"
        Then User Clears The "Criminal justice area" Textbox
        Then User Clears The "Other location" Textbox
        Then User Enters "<InvalidCourtValue>" Into The "Court" Textbox
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "There is a problem Court location not found"
        Then User Clears The "Court" Textbox
        Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
        When User Set "<UpdatedHH>" and "<UpdatedMM>" In The "Duration" Field
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "Success Update completeList successfully updated"
        Examples:
            | User  | TableName | APIDate  | DisplayDate  | SearchDate | Time           | Court  | courtLocation                 | Description          | Status | Entries | InvalidSearchDate | UpdatedSearchDate | InvalidTime1 | InvalidTime2 | InvalidTime3 | UpdatedTime | UpdatedDescription                    | InvalidStatus | OtherLocation | CJAValue | HH | MM | OptionText                | SearchText | UpdatedHH | UpdatedMM | UpdatedOtherLocation      | InvalidCJAValue | InvalidCourtValue |
            | user1 | Lists     | todayiso | todaydisplay | today      | timenowhhmm-3h | RCJ001 | Royal Courts of Justice Set 1 | Test Update {RANDOM} | OPEN   | 0       | 32/13/2025        | 12/12/2025        | 44:*SKIP*    | *SKIP*:33    | 46:70        | 16:30       | Updated Description For Test {RANDOM} | Choose        |               |          | 11 | 30 | Cardiff Crown Court Set 4 | CCC033     | 3         | 45        | Updated Location {RANDOM} | InvalidCJA      | InvalidCourt      |

    @ignore @ARCPOC-214 @ARCPOC-1073
    Scenario Outline: Close application list with NO ALE
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | description   | status               | courtLocationCode | durationHours | durationMinutes |
            | <APIDate> | <Time> | <Description> | <BeforeUpdateStatus> | <Court>           |               |                 |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       |        |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location        | Description   | Entries | Status |
            | <DisplayDate> | <Time> | <courtLocation> | <Description> | 0       | OPEN   |
        Then User Clicks On The Link "List details"
        Then User Verify The Page URL Contains "#list-details"
        Then User Verifies "<BeforeUpdateStatus>" Is Selected In The " Select list status " Dropdown
        Then User Selects "<Status>" In The "Select list status" Dropdown
        When User Clicks On The "Update" Button
        Then User Sees Notification Banner "Please enter positive value for either hours or minutes to close this list"
        When User Clears The Duration Field "Duration"
        When User Set "<durationHours>" and "<durationMinutes>" In The "Duration" Field
        When User Clicks On The "Update" Button
        # Waiting for the bug ARCPOC-920 to be fixed, as the expected notification banner is not showing after setting duration and clicking update button for closing the list.
        Then User Sees Notification Banner "Success Application List closed successfully If you believe this was in error, please contact support."
        Then User See "Are you sure you want to close this application list?" On The Page
        When User Clicks On The "Yes - close" Button
        Then User Sees Notification Banner "Success Application List closed successfully If you believe this was in error, please contact support."
        Examples:
            | User  | TableName | APIDate  | DisplayDate  | SearchDate | Time           | Court  | courtLocation                 | Description   | Status | BeforeUpdateStatus | durationHours | durationMinutes |
            | user1 | Lists     | todayiso | todaydisplay | today      | timenowhhmm-3h | RCJ001 | Royal Courts of Justice Set 1 | Test {RANDOM} | CLOSED | OPEN               | 3             | 3               |


    @ignore @ARCPOC-214 @ARCPOC-1073 @tp
    Scenario Outline: Close application list with One ALE
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | description   | status               | courtLocationCode | durationHours | durationMinutes |
            | <APIDate> | <Time> | <Description> | <BeforeUpdateStatus> | <Court>           |               |                 |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | MX99009                        |
            | applicant.person.name.title                   | Mr                             |
            | applicant.person.name.surname                 | Taylor {RANDOM}                |
            | applicant.person.name.firstForename           | Henry                          |
            | applicant.person.name.secondForename          | James                          |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street           |
            | applicant.person.contactDetails.addressLine2  | Westminster                    |
            | applicant.person.contactDetails.addressLine3  | London                         |
            | applicant.person.contactDetails.addressLine4  | Greater London                 |
            | applicant.person.contactDetails.addressLine5  | United Kingdom                 |
            | applicant.person.contactDetails.postcode      | SW1A 1AA                       |
            | applicant.person.contactDetails.phone         | 0203{RANDOM}                   |
            | applicant.person.contactDetails.mobile        | 07123{RANDOM}                  |
            | applicant.person.contactDetails.email         | applicant{RANDOM}@example.com  |
            | respondent.person.name.title                  | Ms                             |
            | respondent.person.name.surname                | Clark {RANDOM}                 |
            | respondent.person.name.firstForename          | Emily                          |
            | respondent.person.name.secondForename         | Rose                           |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road           |
            | respondent.person.contactDetails.addressLine2 | Bristol                        |
            | respondent.person.contactDetails.addressLine3 | Avon                           |
            | respondent.person.contactDetails.addressLine4 | United Kingdom                 |
            | respondent.person.contactDetails.postcode     | BS1 5AA                        |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.dateOfBirth                        | todayiso-25y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | feeStatuses.0.paymentReference                | <feeReference>                 |
            | feeStatuses.0.status                          | <feeStatus>                    |
            | feeStatuses.0.statusDate                      | <feeStatusDate>                |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-{RANDOM}                   |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       |        |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location        | Description   | Entries | Status |
            | <DisplayDate> | <Time> | <courtLocation> | <Description> | 1       | OPEN   |
        Then User Clicks On The Link "List details"
        Then User Verify The Page URL Contains "#list-details"
        Then User Verifies "<BeforeUpdateStatus>" Is Selected In The " Select list status " Dropdown
        Then User Selects "<Status>" In The "Select list status" Dropdown
        When User Clicks On The "Update" Button
        # Then User Sees Notification Banner "Please enter positive value for either hours or minutes to close this list"
        # When User Clears The Duration Field "Duration"
        # When User Set "<durationHours>" and "<durationMinutes>" In The "Duration" Field
        # Waiting for the bug ARCPOC-920 to be fixed, as the expected notification banner is not showing after setting duration and clicking update button for closing the list.
        Then User Sees Notification Banner "Success Application List closed successfully If you believe this was in error, please contact support."
        Then User See "Are you sure you want to close this application list?" On The Page
        When User Clicks On The "Yes - close" Button
        Then User Sees Notification Banner "Success Application List closed successfully If you believe this was in error, please contact support."
        Examples:
            | User  | TableName | APIDate  | DisplayDate  | SearchDate | Time           | Court  | courtLocation                 | Description   | Status | BeforeUpdateStatus | durationHours | durationMinutes | feeReference | feeStatus | feeStatusDate |
            | user1 | Lists     | todayiso | todaydisplay | today      | timenowhhmm-3h | RCJ001 | Royal Courts of Justice Set 1 | Test {RANDOM} | CLOSED | OPEN               |               |                 | REF-{RANDOM} | PAID      | todayiso      |
