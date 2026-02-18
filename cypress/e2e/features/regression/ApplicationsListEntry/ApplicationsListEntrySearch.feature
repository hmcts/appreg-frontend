Feature: Applications List Entry Search

    @ignore @ARCPOC-222 @ARCPOC-442 @ARCPOC-1086 @TP
    Scenario: Verify components on applications list entry (ALE) search page
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User clicks on the link using exact text match "Applications"
        Then User Verify The Page URL Contains "/applications"
        Then User Should See The Date Field "List date"
        Then User Sees Text "For example, 27 3 2007" In "List date" Field
        Then User Should See The Textbox "Court"
        Then User Should See The Textbox "Applicant organisation"
        Then User Should See The Textbox "Applicant surname"
        Then User Should See The Textbox "Respondent organisation"
        Then User Should See The Textbox "Respondent surname"
        Then User Should See The Dropdown "Select application status"
        Then User Should See The Details section "Advanced search"
        Then User Clicks On The Details section "Advanced search"
        Then User Should See The Textbox "Respondent post code" In The "Advanced search" section
        Then User Should See The Textbox "Criminal justice area" In The "Advanced search" section
        Then User Should See The Textbox "Other location description" In The "Advanced search" section
        Then User Should See The Textbox "Standard applicant code" In The "Advanced search" section
        Then User Should See The Textbox "Account reference" In The "Advanced search" section
        Then User Should See The Button "Search"
        Then User Should See The Button "Clear search"

    @ignore @ARCPOC-222 @ARCPOC-442 @ARCPOC-1052
    Scenario Outline: Verify applications list entry table shows empty state with no results
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User clicks on the link using exact text match "Applications"
        Then User Verify The Page URL Contains "/applications"
        When User Searches Application List Entry With:
            | Date         | Applicant Org | Respondent Org | CourtSearch | Court | Applicant surname | Respondent surname | List other location | Applicant code | Post code | CJA | Select status | Account reference |
            | <SearchDate> |               |                |             |       |                   |                    |                     |                |           |     |               |                   |
        When User Clicks On The "Search" Button
        Then User Sees Notification Banner "<NotificationMessage>"
        Then User See "No results found." On The Page
        Examples:
            | User  | SearchDate | NotificationMessage                                               |
            | user1 | 15/08/2023 | Important No application list entries found Try different filters |

    @ignore @ARCPOC-222 @ARCPOC-442 @ARCPOC-1052 @ARCPOC-1076
    Scenario Outline: Verify Search application list entries are listed in the table on ALE search page
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User clicks on the link using exact text match "Applications"
        And User Verify The Page URL Contains "/applications"
        When User Searches Application List Entry With:
            | Date         | Applicant Org  | Respondent Org  | CourtSearch   | Court   | Applicant surname  | Respondent surname  | List other location | Applicant code  | Post code  | CJASearch   | CJA   | Select status  | Account reference  |
            | <SearchDate> | <ApplicantOrg> | <RespondentOrg> | <CourtSearch> | <Court> | <ApplicantSurname> | <RespondentSurname> | <OtherLocation>     | <ApplicantCode> | <PostCode> | <CJASearch> | <CJA> | <SelectStatus> | <AccountReference> |
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

    @ignore @ARCPOC-222 @ARCPOC-442 @ARCPOC-1083
    Scenario: Verify Validation Error Messages on Application list entry Search Page
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User clicks on the link using exact text match "Applications"
        Then User Verify The Page URL Contains "/applications"
        When User Clicks On The "Search" Button
        Then User Sees Notification Banner "There is a problem Invalid Search Criteria. At least one field must be entered."
        When User Searches Application List Entry With:
            | Date          | Applicant Org | Respondent Org | CourtSearch | Court | Applicant surname | Respondent surname | List other location | Applicant code | Post code | CJA | Select status | Account reference |
            | <InvalidDate> | ACME          |                |             |       |                   |                    |                     |                |           |     |               |                   |
        Then User Sees Notification Banner "There is a problem Enter a valid date"
        When User Clicks On The "Clear search" Button
        Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<InvalidCourt>"
        Then User Verifies "<Info>" Is Visible Under The "Court" Textbox
        When User Clicks On The "Search" Button
        Then User Sees Notification Banner "There is a problem Court location not found"
        When User Clicks On The "Clear search" Button
        Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<InvalidCJA>"
        Then User Verifies "<Info>" Is Visible Under The "CJA" Textbox
        When User Clicks On The "Search" Button
        Then User Sees Notification Banner "There is a problem Criminal justice area not found"
        When User Clicks On The "Clear search" Button
        When User Searches Application List Entry With:
            | Date | Applicant Org | Respondent Org | CourtSearch | Court | Applicant surname | Respondent surname | List other location | Applicant code | Post code         | CJA | Select status | Account reference |
            |      |               |                |             |       |                   |                    |                     |                | <InvalidPostcode> |     |               |                   |
        Then User Sees Notification Banner "There is a problem Enter a valid UK postcode"
        When User Clicks On The "Clear search" Button
        When User Searches Application List Entry With:
            | Date        | Applicant Org | Respondent Org | CourtSearch | Court | Applicant surname | Respondent surname | List other location | Applicant code | Post code       | CJASearch | CJA | Select status | Account reference |
            | <ValidDate> | ACME          |                |             |       | Taylor            |                    |                     |                | <ValidPostcode> |           |     | Open          |                   |
        Then User Sees Notification Banner "Important No application list entries found Try different filters"
        Then User See "No results found." On The Page
        Examples:
            | InvalidDate | ValidDate  | InvalidCourt | InvalidCJA | InvalidPostcode | ValidPostcode | OptionText | SearchText | Info             |
            | 31/13/2048  | 12/01/2025 | InvalidCourt | InvalidCJA | ABC123          | AB1 2CD       |            | Cardiff    | No results found |

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