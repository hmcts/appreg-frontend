Feature: Applications List Entry Search

    @regression @ARCPOC-222 @ARCPOC-442
    Scenario: Verify components on applications list entry (ALE) search page
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User clicks on the link using exact text match "Applications"
        Then User Verify The Page URL Contains "/applications"
        Then User Should See The Date Field "Date"
        Then User Sees Text "For example, 27 3 2007" In "Date" Field
        Then User Should See The Textbox "Applicant Org"
        Then User Sees Text "Enter the applicants organisation" In "Applicant Org" Field
        Then User Should See The Textbox "Respondent Org"
        Then User Sees Text "Enter the respondents organisation" In "Respondent Org" Field
        Then User Should See The Textbox "Court"
        Then User Sees Text "Enter a description of the court" In "Court" Field
        Then User Should See The Textbox "Applicant surname"
        Then User Sees Text "The applicants last name" In "Applicant surname" Field
        Then User Should See The Textbox "Respondent surname"
        Then User Sees Text "The respondent last name" In "Respondent surname" Field
        Then User Should See The Textbox "List other location"
        Then User Sees Text "Other location description" In "List other location" Field
        Then User Should See The Textbox "Applicant code"
        Then User Sees Text "The standard applicant code" In "Applicant code" Field
        Then User Should See The Textbox "Post code"
        Then User Sees Text "Respondents post code" In "Post code" Field
        Then User Should See The Textbox "CJA"
        Then User Sees Text "Start typing to search" In "CJA" Field
        Then User Should See The Dropdown "Select status"
        Then User Sees Text "Status of the application" In "Select status" Field
        Then User Should See The Textbox "Account reference"
        Then User Sees Text "The account reference code" In "Account reference" Field
        Then User Should See The Button "Search"
        Then User Should See The Button "Clear search"

    @regression @ARCPOC-222 @ARCPOC-442 @ARCPOC-1052
    Scenario Outline: Verify applications list entry table shows empty state with no results
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User clicks on the link using exact text match "Applications"
        Then User Verify The Page URL Contains "/applications"
        When User Searches Application List Entry With:
            | Date         | Applicant Org | Respondent Org | CourtSearch | Court | Applicant surname | Respondent surname | List other location | Applicant code | Post code | CJA | Select status | Account reference |
            | <SearchDate> |               |                |             |       |                   |                    |                     |                |           |     |               |                   |
        # Verify notification banner is displayed for empty state - Query raised for text of Notification banner
        When User Clicks On The "Search" Button
        Then User Sees Notification Banner "<NotificationMessage>"
        Then User See "No results found." On The Page
        Examples:
            | User  | SearchDate | NotificationMessage                                               |
            | user1 | 15/08/2023 | Important No application list entries found Try different filters |

    @regression @ARCPOC-222 @ARCPOC-442 @ARCPOC-1052 @ARCPOC-1076 @TP
    Scenario Outline: Verify Search button state and application list entry results on ALE search page
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User clicks on the link using exact text match "Applications"
        And User Verify The Page URL Contains "/applications"
        # Initial state validation
        Then User Should See The Button "Search" Is Disabled
        When User Clicks On The "Clear search" Button
        And User Searches Application List Entry With:
            | Date         | Applicant Org  | Respondent Org  | CourtSearch   | Court   | Applicant surname  | Respondent surname  | List other location | Applicant code  | Post code  | CJASearch   | CJA   | Select status  | Account reference  |
            | <SearchDate> | <ApplicantOrg> | <RespondentOrg> | <CourtSearch> | <Court> | <ApplicantSurname> | <RespondentSurname> | <OtherLocation>     | <ApplicantCode> | <PostCode> | <CJASearch> | <CJA> | <SelectStatus> | <AccountReference> |
        # Button state after input
        Then User Should See The Button "Search" Is Enabled
        # Results validation (only when results are expected)
        Then User Should See Table "<TableName>" Has Sortable Headers "Date, Applicant, Respondent, Application title, Fee, Resulted, Status"
        And User Should See Table "<TableName>" Header "Actions" Is Not Sortable
        And User Should See Row In Table "<TableName>" With Values:
            | Date         | Applicant   | Respondent   | Application title  | Fee   | Resulted   | Status   |
            | <ResultDate> | <Applicant> | <Respondent> | <ApplicationTitle> | <Fee> | <Resulted> | <Status> |
        Examples:
            | User  | SearchDate | ApplicantOrg | RespondentOrg | CourtSearch | Court                             | ApplicantSurname | RespondentSurname | OtherLocation | ApplicantCode | PostCode | CJASearch | CJA         | SelectStatus | AccountReference | TableName                | ResultDate | Applicant                        | Respondent                                      | ApplicationTitle                                     | Fee | Resulted | Status |
            | user1 | 28/01/2026 | ACME         |               |             |                                   |                  |                   |               |               |          |           |             |              |                  | Application list entries | 28/01/2026 | ACME Industries LTD              | Beta Solutions Inc                              | Condemnation of Unfit Food                           | No  | No       | CLOSED |
            | user1 | 26/01/2026 |              | Beta          |             |                                   |                  |                   |               |               |          |           |             |              |                  | Application list entries | 26/01/2026 | ACME Industries LTD              | Beta Solutions Inc                              | Condemnation of Unfit Food                           | No  | No       | Closed |
            | user1 | 28/01/2026 |              |               | LCCC025     | Leeds Combined Court Centre Set 3 | Taylor           |                   |               |               |          |           |             |              |                  | Application list entries | 28/01/2026 | Mr Henry Taylor 35874            | Ms Emily Clark 35874                            | Issue of liability order summons - council tax       | No  | No       | OPEN   |
            | user1 |            |              |               |             |                                   |                  |                   | MCJC002       |               |          | 10        | Southampton |              |                  | Application list entries | 13/01/2026 | Test Organisation 13 - applicant | Mr TestForenameRespondent TestSurnameRespondent | Issue of liability order summons - non-domestic rate | No  | No       | OPEN   |

    @regression @ARCPOC-222 @ARCPOC-442
    # Asked Dave for more validation error message scenarios. Will update the table once I have the information.
    Scenario: Verify Validation Error Messages on Application list entry Search Page
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User clicks on the link using exact text match "Applications"
        Then User Verify The Page URL Contains "/applications"
        When User Searches Application List Entry With:
            | Date | Applicant Org | Respondent Org | CourtSearch | Court | Applicant surname | Respondent surname | List other location | Applicant code | Post code | CJA | Select status | Account reference |
            | dd// |               |                |             |       |                   |                    |                     |                |           |     |               |                   |
        Then User Should See The Button "Search" Is Disabled
        When User Searches Application List Entry With:
            | Date         | Applicant Org | Respondent Org | CourtSearch | Court | Applicant surname | Respondent surname | List other location | Applicant code | Post code | CJA | Select status | Account reference |
            | dd/mm/*SKIP* |               |                |             |       |                   |                    |                     |                |           |     |               |                   |
        Then User Should See The Button "Search" Is Disabled
        When User Searches Application List Entry With:
            | Date       | Applicant Org | Respondent Org | CourtSearch | Court | Applicant surname | Respondent surname | List other location | Applicant code | Post code | CJA | Select status | Account reference |
            | dd/mm/yyyy | ACME          |                |             |       | Smith             |                    |                     |                |           |     |               |                   |
        Then User Should See The Button "Search" Is Enabled
        When User Clicks On The "Search" Button
        Then User Sees Validation Error Messages "There is a problem Enter a real date"

    @ignore @ARCPOC-222 @ARCPOC-442
    Scenario Outline: Verify Applications List Entry table sorting functionality
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User clicks on the link using exact text match "Applications"
        Then User Verify The Page URL Contains "/applications"
        # Search to get table with data
        Then User Selects "<Status>" In The "Select status" Dropdown
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        # Verify all sortable headers default to 'none'
        Then User Should See Table "<TableName>" Header "Date" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Applicant" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Respondent" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Application title" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Fee" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Resulted" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Status" Has Sort Order "none"
        # Test sort cycle: none -> ascending -> descending
        When User Clicks On Table Header "<Column>" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "<Column>" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Has Rows
        Then User Should See Table "<TableName>" Column "<Column>" Is Sorted "ascending"
        When User Clicks On Table Header "<Column>" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "<Column>" Has Sort Order "descending"
        Then User Should See Table "<TableName>" Has Rows
        Then User Should See Table "<TableName>" Column "<Column>" Is Sorted "descending"
        Examples:
            | User  | TableName                | Status | Column |
            | user1 | Application list entries | Closed | Date   |