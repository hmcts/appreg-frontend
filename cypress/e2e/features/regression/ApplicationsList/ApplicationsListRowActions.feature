Feature: Applications List Search and Print PDF Download

    @regression @ARCPOC-214 @ARCPOC-453 @ARCPOC-799 @ARCPOC-802 @ARCPOC-449
    Scenario Outline: Verify PDF download for 0 entries
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | status   | description   | courtLocationCode   |
            | <DisplayDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link "Applications list"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Enters "<Description>" Into The "Description" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Rows
        # Click Print continuous to download PDF
        When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User Sees Notification Banner "There is a problem No entries available to print"
        Then User Clears The "Description" Textbox
        Then User Enters "past" Into The "Description" Textbox
        When User Clicks On The "Search" Button
        Then User Sees Notification Banner "Important No lists found Try different filters, or create a new list"
        Examples:
            | User  | TableName | SearchDate | DisplayDate | Time           | courtLocationCode | Court                             | Description                              | Entries | Status | SelectButtonText | ButtonName       |
            | user1 | Lists     | today      | todayiso    | timenowhhmm-2h | RCJ001            | Royal Courts of Justice Set 1     | Test_{RANDOM} for Applications to review | 0       | OPEN   | Select           | Print continuous |
            | user1 | Lists     | today      | todayiso    | timenowhhmm-2h | LCCC025           | Leeds Combined Court Centre Set 3 | Test_{RANDOM} for Leeds applications     | 0       | OPEN   | Select           | Print page       |

    @regression @ARCPOC-214 @ARCPOC-453 @ARCPOC-449 @PJ
    Scenario Outline: Verify PDF download for print continuous and print page with entries for Court
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link "Applications list"
        When User Set Date Field "Date" To "<SearchDate>"
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks "<SelectButtonText>" Then "Print continuous" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        # Verify PDF was downloaded and contains expected content
        Then User Verifies PDF "<PDFName>" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Has <Pages> Pages
        Then User Verifies Latest Downloaded PDF Contains Text "Check List Report"
        #  Time is not added due to bug ARCPOC-803
        Then User Verifies Latest Downloaded PDF Contains <Entries> "Applicant" Entries
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Date & Time       | <DisplayDate>                                              |
            | Duration          | <Duration>                                                 |
            | Location          | <Court>                                                    |
            | Applicant         | Miss Sophia King                                           |
            | Case Reference    | CASE101-01                                                 |
            | Application Code  | AP99004                                                    |
            | Account Reference | ACC000189                                                  |
            | Application Title | Request for Certificate of Refusal to State a Case (Civil) |
            | Applicant         | Mr James Lee                                               |
            | Respondent        | Mr John Turner                                             |
            | Case Reference    | CASE101-02                                                 |
            | Application Code  | CT99001                                                    |
        Then User Clears Downloaded PDFs
        When User Clicks "<SelectButtonText>" Then "Print page" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        # Verify PDF was downloaded and contains expected content
        Then User Verifies PDF "<PDFName>" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Has <Pages> Pages
        Then User Verifies Latest Downloaded PDF Contains Text "<Court>"
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Application brought by       | Miss Sophia King                                           |
            | Respondent                   | -                                                          |
            | Matter considered            | Request for Certificate of Refusal to State a Case (Civil) |
            | AP99004                      | -                                                          |
            | This matter was dated before | <DisplayDate>                                              |
            | Produced on:                 | today                                                      |
            | Application brought by       | Mr James Lee                                               |
            | Respondent                   | Mr John Turner                                             |
            | Matter considered            | Issue of liability order summons -council tax (bulk)       |
            | CT99001                      | -                                                          |
            | This matter was dated before | <DisplayDate>                                              |
            | Produced on:                 | <Date>                                                     |
        Then User Clears Downloaded PDFs
        Examples:
            | User  | TableName | SearchDate | DisplayDate | Time  | Court                         | Description             | Entries | Status | SelectButtonText | ButtonName | Duration          | PDFName                       | Pages | Date  |
            | user1 | Lists     | 16/11/2025 | 2025-11-16  | 13:26 | Royal Courts of Justice Set 1 | ENFORCEMENT LIST - TEST | 2       | Open   | Select           |            | 2 Hours 0 Minutes | royal-courts-of-justice-set-1 | 2     | today |

    @regression @ARCPOC-214 @ARCPOC-453 @ARCPOC-449
    Scenario Outline: Verify PDF download for print page with entries for CJA
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | status   | description   | cjaCode   | otherLocationDescription   |
            | <DisplayDate> | <Time> | <Status> | <Description> | <cjaCode> | <otherLocationDescription> |
        Then User Verify Response Status Code Should Be "201"
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link "Applications list"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<cjaCode>"
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location     | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <OptionText> | <Description> | <Entries> | <Status> |
        # Verify PDF was downloaded and contains expected content
        Then User Sees Notification Banner "There is a problem No entries available to print"
        Then User Clears Downloaded PDFs
        Examples:
            | User  | TableName | SearchDate | DisplayDate | Time           | cjaCode | OptionText     | otherLocationDescription                          | Description             | Entries | Status | SelectButtonText | ButtonName | Duration          | PDFName      |
            | user1 | Lists     | today      | todayiso    | timenowhhmm-1h | A8      | CJA Number 308 | This is a location description for CJA Number 318 | ENFORCEMENT LIST - TEST | 0       | OPEN   | Select           | Print page | 2 Hours 0 Minutes | cja-number-1 |