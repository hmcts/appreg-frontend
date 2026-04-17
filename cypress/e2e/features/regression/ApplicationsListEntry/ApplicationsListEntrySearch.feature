Feature: Applications List Entry Search

    @regression @applicationListEntry @ARCPOC-222 @ARCPOC-442 @ARCPOC-1086
    Scenario: Verify components on applications list entry (ALE) search page
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Applications"
        Then User Verify The Page URL Contains "/applications"
        Then User Should See The Date Field "List date"
        Then User Sees Text "For example, 27 3 2007" In "List date" Field
        Then User Should See The Textbox "Court"
        Then User Should See The Textbox "Applicant organisation"
        Then User Should See The Textbox "Applicant surname"
        Then User Should See The Textbox "Respondent organisation"
        Then User Should See The Textbox "Respondent surname"
        Then User Should See The Dropdown "Select application status"
        Then User Should See The Accordion "Advanced search"
        When User Toggles The Accordion "Advanced search"
        Then User Should See The Textbox "Respondent post code"
        Then User Should See The Textbox "Criminal justice area"
        Then User Should See The Textbox "Other location description"
        Then User Should See The Textbox "Standard applicant code"
        Then User Should See The Textbox "Account reference"
        Then User Should See The Button "Search"
        Then User Should See The Button "Clear search"

    @regression @applicationListEntry @ARCPOC-222 @ARCPOC-442 @ARCPOC-1052
    Scenario Outline: Verify applications list entry table shows empty state with no results
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link Using Exact Text Match "Applications"
        Then User Verify The Page URL Contains "/applications"
        When User Searches Application List Entry With:
            | Date         | CourtSearch | Court | Applicant organisation | Applicant surname | Respondent organisation | Respondent surname | Select application status | Respondent post code | Criminal justice area | Other location description | Standard applicant code | Account reference |
            | <SearchDate> |             |       |                        |                   |                         |                    |                           |                      |                       |                            |                         |                   |
        Then User Sees Notification Banner "<NotificationMessage>"
        Then User See "No results found." On The Page
        Examples:
            | User  | SearchDate | NotificationMessage                                               |
            | user1 | 15/08/2023 | Important No application list entries found Try different filters |

    @regression @ARCPOC-222 @ARCPOC-442 @ARCPOC-1052 @ARCPOC-1076
    Scenario Outline: Verify Search application list entries are listed in the table on ALE search page with Court, Applicant Orgs and Respondent Orgs
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                             | durationHours | durationMinutes | courtLocationCode |
            | todayiso | timenowhhmm-2h | OPEN   | Applications to review at Test_{RANDOM} | 2             | 22              | LCCC065           |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                           |
            | applicationCode                                     | CT99002                        |
            | applicant.organisation.name                         | Applicant Industries {RANDOM}  |
            | applicant.organisation.contactDetails.addressLine1  | {RANDOM} King Street           |
            | applicant.organisation.contactDetails.addressLine2  | Westminster                    |
            | applicant.organisation.contactDetails.addressLine3  | London                         |
            | applicant.organisation.contactDetails.addressLine4  | Greater London                 |
            | applicant.organisation.contactDetails.addressLine5  | United Kingdom                 |
            | applicant.organisation.contactDetails.postcode      | SW1A 1AA                       |
            | applicant.organisation.contactDetails.phone         | 0203{RANDOM}                   |
            | applicant.organisation.contactDetails.mobile        | 07123{RANDOM}                  |
            | applicant.organisation.contactDetails.email         | applicant{RANDOM}@example.com  |
            | respondent.organisation.name                        | Respondent Industries {RANDOM} |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Market Road           |
            | respondent.organisation.contactDetails.addressLine2 | Bristol                        |
            | respondent.organisation.contactDetails.addressLine3 | Avon                           |
            | respondent.organisation.contactDetails.addressLine4 | United Kingdom                 |
            | respondent.organisation.contactDetails.postcode     | BS15 5AA                       |
            | respondent.organisation.contactDetails.phone        | 0117{RANDOM}                   |
            | respondent.organisation.contactDetails.mobile       | 07984{RANDOM}                  |
            | respondent.organisation.contactDetails.email        | respondent{RANDOM}@example.com |
            | wordingFields.0.key                                 | Reference                      |
            | wordingFields.0.value                               | {RANDOM}                       |
            | hasOffsiteFee                                       | true                           |
            | caseReference                                       | CASE-{RANDOM}                  |
            | accountNumber                                       | ACC-{RANDOM}                   |
            | notes                                               | Case noted with ref {RANDOM}   |
            | lodgementDate                                       | todayiso                       |
            | officials.0.title                                   | Mr                             |
            | officials.0.surname                                 | Turner {RANDOM}                |
            | officials.0.forename                                | Graham                         |
            | officials.0.type                                    | MAGISTRATE                     |
            | officials.1.title                                   | Ms                             |
            | officials.1.surname                                 | Hayes {RANDOM}                 |
            | officials.1.forename                                | Laura                          |
            | officials.1.type                                    | MAGISTRATE                     |
            | officials.2.title                                   | Mr                             |
            | officials.2.surname                                 | Miller {RANDOM}                |
            | officials.2.forename                                | Peter                          |
            | officials.2.type                                    | CLERK                          |
            | officials.3.title                                   | Ms                             |
            | officials.3.surname                                 | Patel {RANDOM}                 |
            | officials.3.forename                                | Anita                          |
            | officials.3.type                                    | MAGISTRATE                     |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link Using Exact Text Match "Applications"
        And User Verify The Page URL Contains "/applications"
        When User Searches Application List Entry With:
            | Date         | CourtSearch   | Court   | Applicant organisation | Applicant surname  | Respondent organisation | Respondent surname  | Select application status | Respondent post code | CJASearch   | Criminal justice area | Other location description | Standard applicant code | Account reference  |
            | <SearchDate> | <CourtSearch> | <Court> | <ApplicantOrg>         | <ApplicantSurname> | <RespondentOrg>         | <RespondentSurname> | <SelectStatus>            | <RespondentPostcode> | <CJASearch> | <CJA>                 | <OtherLocation>            | <ApplicantCode>         | <AccountReference> |

        Then User Should See Table "<TableName>" Has Sortable Headers "Date, Applicant, Respondent, Application title, Fee, Resulted, Status"
        And User Should See Table "<TableName>" Header "Actions" Is Not Sortable
        And User Should See Row In Table "<TableName>" With Values:
            | Date          | Applicant   | Respondent   | Application title  | Fee   | Resulted   | Status   |
            | <DisplayDate> | <Applicant> | <Respondent> | <ApplicationTitle> | <Fee> | <Resulted> | <Status> |
        Examples:
            | User  | SearchDate | CourtSearch | Court                             | ApplicantOrg                  | ApplicantSurname | RespondentOrg | RespondentSurname | SelectStatus | RespondentPostcode | CJASearch | CJA | OtherLocation | ApplicantCode | AccountReference | TableName                | DisplayDate  | Applicant                     | Respondent                     | ApplicationTitle                               | Fee | Resulted | Status |
            | user1 | today      | LCCC065     | Leeds Combined Court Centre Set 7 | Applicant Industries {RANDOM} |                  |               |                   |              |                    |           |     |               |               |                  | Application list entries | todaydisplay | Applicant Industries {RANDOM} | Respondent Industries {RANDOM} | Issue of liability order summons - council tax | No  | No       | OPEN   |

    @regression @applicationListEntry @ARCPOC-222 @ARCPOC-442 @ARCPOC-1052 @ARCPOC-1076
    Scenario Outline: Verify Search application list entries are listed in the table on ALE search page with Other Location and CJA, Applicant Person and Respondent Person
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | durationHours   | durationMinutes   | otherLocationDescription   | cjaCode     |
            | <Dateiso> | <Time> | <Status> | <Description> | <DurationHours> | <DurationMinutes> | <OtherLocationDescription> | <CJASearch> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | CT99002                        |
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
            | respondent.person.contactDetails.postcode     | BS15 5AA                       |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-25y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | true                           |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-{RANDOM}                   |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
            | officials.0.title                             | Mr                             |
            | officials.0.surname                           | Turner {RANDOM}                |
            | officials.0.forename                          | Graham                         |
            | officials.0.type                              | MAGISTRATE                     |
            | officials.1.title                             | Ms                             |
            | officials.1.surname                           | Hayes {RANDOM}                 |
            | officials.1.forename                          | Laura                          |
            | officials.1.type                              | MAGISTRATE                     |
            | officials.2.title                             | Mr                             |
            | officials.2.surname                           | Miller {RANDOM}                |
            | officials.2.forename                          | Peter                          |
            | officials.2.type                              | CLERK                          |
            | officials.3.title                             | Ms                             |
            | officials.3.surname                           | Patel {RANDOM}                 |
            | officials.3.forename                          | Anita                          |
            | officials.3.type                              | MAGISTRATE                     |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link Using Exact Text Match "Applications"
        And User Verify The Page URL Contains "/applications"
        When User Searches Application List Entry With:
            | Date         | CourtSearch   | Court   | Applicant organisation | Applicant surname  | Respondent organisation | Respondent surname  | Select application status | Respondent post code | CJASearch   | Criminal justice area | Other location description | Standard applicant code | Account reference  |
            | <SearchDate> | <CourtSearch> | <Court> | <ApplicantOrg>         | <ApplicantSurname> | <RespondentOrg>         | <RespondentSurname> | <SelectStatus>            | <RespondentPostcode> | <CJASearch> | <CJA>                 | <OtherLocation>            | <ApplicantCode>         | <AccountReference> |

        Then User Should See Table "<TableName>" Has Sortable Headers "Date, Applicant, Respondent, Application title, Fee, Resulted, Status"
        And User Should See Table "<TableName>" Header "Actions" Is Not Sortable
        And User Should See Row In Table "<TableName>" With Values:
            | Date          | Applicant   | Respondent   | Application title  | Fee   | Resulted   | Status   |
            | <DisplayDate> | <Applicant> | <Respondent> | <ApplicationTitle> | <Fee> | <Resulted> | <Status> |
        Examples:
            | User  | Dateiso  | Time           | Description                             | DurationHours | DurationMinutes | otherLocationDescription         | SearchDate | CourtSearch | Court | ApplicantOrg | ApplicantSurname | RespondentOrg | RespondentSurname | SelectStatus | RespondentPostcode | CJASearch | CJA    | OtherLocation | ApplicantCode | AccountReference | TableName                | DisplayDate  | Applicant                | Respondent              | ApplicationTitle                               | Fee | Resulted | Status |
            | user1 | todayiso | timenowhhmm-2h | Applications to review at Test_{RANDOM} | 1             | 11              | Temporary Courtroom at Town Hall |            |             |       |              | Taylor {RANDOM}  |               |                   | Open         | BS15 5AA           | 01        | London |               |               |                  | Application list entries | todaydisplay | Mr Henry Taylor {RANDOM} | Ms Emily Clark {RANDOM} | Issue of liability order summons - council tax | No  | No       | OPEN   |

    @regression @applicationListEntry @ARCPOC-222 @ARCPOC-442 @ARCPOC-1083
    Scenario: Verify Validation Error Messages on Application list entry Search Page
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Applications"
        Then User Verify The Page URL Contains "/applications"
        When User Clicks On The "Search" Button
        Then User Sees Validation Error Banner "There is a problem Invalid Search Criteria. At least one field must be entered."
        When User Searches Application List Entry With:
            | Date          | CourtSearch | Court | Applicant organisation | Applicant surname | Respondent organisation | Respondent surname | Select application status | Respondent post code | CJASearch | Criminal justice area | Other location description | Standard applicant code | Account reference |
            | <InvalidDate> |             |       | ACME                   |                   |                         |                    |                           |                      |           |                       |                            |                         |                   |
        Then User Sees Validation Error Banner "There is a problem Enter a valid date"
        When User Clicks On The "Clear search" Button
        Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<InvalidCourt>"
        Then User Verifies "<Info>" Is Visible Under The "Court" Textbox
        When User Clicks On The "Search" Button
        Then User Sees Validation Error Banner "There is a problem Court location not found"
        When User Clicks On The "Clear search" Button
        When User Toggles The Accordion "Advanced search"
        Then User Selects "<OptionText>" From The Textbox "Criminal justice area" Autocomplete By Typing "<InvalidCJA>"
        Then User Verifies "<Info>" Is Visible Under The "Criminal justice area" Textbox
        When User Clicks On The "Search" Button
        Then User Sees Validation Error Banner "There is a problem Criminal justice area not found"
        When User Clicks On The "Clear search" Button
        When User Searches Application List Entry With:
            | Date | CourtSearch | Court | Applicant organisation | Applicant surname | Respondent organisation | Respondent surname | Select application status | Respondent post code | CJASearch | Criminal justice area | Other location description | Standard applicant code | Account reference |
            |      |             |       |                        |                   |                         |                    |                           | <InvalidPostcode>    |           |                       |                            |                         |                   |
        Then User Sees Validation Error Banner "There is a problem Enter a valid UK postcode"
        When User Clicks On The "Clear search" Button
        When User Searches Application List Entry With:
            | Date        | CourtSearch | Court | Applicant organisation | Applicant surname | Respondent organisation | Respondent surname | Select application status | Respondent post code | CJASearch | Criminal justice area | Other location description | Standard applicant code | Account reference |
            | <ValidDate> |             |       | ACME                   |                   |                         | Taylor             | Open                      | <ValidPostcode>      |           |                       |                            |                         |                   |
        Then User Sees Notification Banner "Important No application list entries found Try different filters"
        Then User See "No results found." On The Page
        Examples:
            | InvalidDate | ValidDate  | InvalidCourt | InvalidCJA | InvalidPostcode | ValidPostcode | OptionText | SearchText | Info             |
            | 31/13/2048  | 12/01/2025 | InvalidCourt | InvalidCJA | ABC123          | AB1 2CD       |            | Cardiff    | No results found |

    @ignore @applicationListEntry @ARCPOC-222 @ARCPOC-442
    Scenario Outline: Verify Applications List Entry table sorting functionality
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link Using Exact Text Match "Applications"
        Then User Verify The Page URL Contains "/applications"
        # Search to get table with data
        Then User Selects "<Status>" In The "Select application status" Dropdown
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