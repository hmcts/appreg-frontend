Feature: Application List Entries - Move

    @regression @applicationsList @ARCPOC-446
    Scenario Outline: Application List - Move Selected Entries to Another Existing List
        Given User Authenticates Via API As "<User>"
        # ── Source list ─────────────────────────────────────────────────────────
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description         | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <SourceDescription> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "sourceListId"
        # Entry 1 - Person applicant + Person respondent (CT99002)
        When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | CT99002                        |
            | applicant.person.name.title                   | Mr                             |
            | applicant.person.name.surname                 | Taylor {RANDOM}                |
            | applicant.person.name.firstForename           | Henry                          |
            | applicant.person.name.secondForename          | James                          |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street           |
            | applicant.person.contactDetails.addressLine2  | Westminster                    |
            | applicant.person.contactDetails.addressLine3  | London                         |
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
            | respondent.person.contactDetails.postcode     | BS15 5AA                       |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-25y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-E1-{RANDOM}                |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        # Entry 2 - Person applicant + Organisation respondent (EF99001)
        When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
            | standardApplicantCode                               | null                           |
            | applicationCode                                     | EF99001                        |
            | applicant.person.name.title                         | Mrs                            |
            | applicant.person.name.surname                       | Johnson {RANDOM}               |
            | applicant.person.name.firstForename                 | Sarah                          |
            | applicant.person.name.secondForename                | Louise                         |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} High Street           |
            | applicant.person.contactDetails.addressLine2        | Manchester                     |
            | applicant.person.contactDetails.addressLine3        | Greater Manchester             |
            | applicant.person.contactDetails.postcode            | M1 1AA                         |
            | applicant.person.contactDetails.phone               | 0161{RANDOM}                   |
            | applicant.person.contactDetails.mobile              | 07700{RANDOM}                  |
            | applicant.person.contactDetails.email               | applicant{RANDOM}@example.com  |
            | respondent.organisation.name                        | Greenfield Consulting {RANDOM} |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Park Lane             |
            | respondent.organisation.contactDetails.addressLine2 | Birmingham                     |
            | respondent.organisation.contactDetails.addressLine3 | West Midlands                  |
            | respondent.organisation.contactDetails.postcode     | B1 1AA                         |
            | respondent.organisation.contactDetails.phone        | 0121{RANDOM}                   |
            | respondent.organisation.contactDetails.mobile       | 07800{RANDOM}                  |
            | wordingFields.0.key                                 | account balance                |
            | wordingFields.0.value                               | {RANDOM}                       |
            | hasOffsiteFee                                       | false                          |
            | caseReference                                       | CASE-{RANDOM}                  |
            | accountNumber                                       | ACC-E2-{RANDOM}                |
            | notes                                               | Case noted with ref {RANDOM}   |
            | lodgementDate                                       | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId2"
        # Entry 3 - Standard applicant APP036 + Person respondent (CT99002)
        When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
            | standardApplicantCode                         | APP036                         |
            | applicationCode                               | CT99002                        |
            | respondent.person.name.title                  | Mr                             |
            | respondent.person.name.surname                | Owen {RANDOM}                  |
            | respondent.person.name.firstForename          | Davies                         |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Station Road          |
            | respondent.person.contactDetails.addressLine2 | Leeds                          |
            | respondent.person.contactDetails.addressLine3 | West Yorkshire                 |
            | respondent.person.contactDetails.postcode     | LS1 1AA                        |
            | respondent.person.contactDetails.phone        | 0113{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07200{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-40y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-E3-{RANDOM}                |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId3"
        # ── Target list ─────────────────────────────────────────────────────────
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time         | status   | description         | courtLocationCode   |
            | <APIDate> | <TargetTime> | <Status> | <TargetDescription> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "targetListId"
        # ── UI flow ─────────────────────────────────────────────────────────────
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description | CourtSearch         | Court   | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      |             | <courtLocationCode> | <Court> |        |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description         | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <SourceDescription> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Should See The Button "Actions" Is Disabled
        # Select entries 1 and 2 to move
        When User Checks The Checkbox In Row Of Table "Entries" With:
            | Sequence number | Account number  | Applicant                           | Respondent                     | Postcode | Title                                          | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | BS15 5AA | Issue of liability order summons - council tax | No  |          |
            | 2               | ACC-E2-{RANDOM} | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | B1 1AA   | Collection Order - Financial Penalty Account   | No  |          |
        Then User Should See The Button "Actions" Is Enabled
        When User Clicks "Actions" Then "Move entries" From Caption Menu In Table "Entries"
        Then User See "Move applications" On The Page
        # Verify all 3 selected rows appear on the result page
        Then User Should See Row In Table "You are moving the following application(s)" With Values:
            | Sequence number | Applicant(s)                        | Respondent(s)                  | Application Title(s)                           |
            | 1               | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | Issue of liability order summons - council tax |
            | 2               | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | Collection Order - Financial Penalty Account   |
        When User Searches Application List With:
            | Date         | Time | List Description    | CourtSearch         | Court   | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      | <TargetDescription> | <courtLocationCode> | <Court> |        |                |     |           |
        When User Clicks "Select" Button In Row Of Table "Lists" With:
            | Date          | Time         | Location | Description         | Entries | Status   |
            | <DisplayDate> | <TargetTime> | <Court>  | <TargetDescription> | 0       | <Status> |
        # ── Move confirm page ───────────────────────────────────────────────────
        Then User See "Are you sure you want to move these applications to this application list?" On The Page
        Then User Should See Row In Table "You are moving the following application(s)" With Values:
            | Sequence number | Applicant(s)                        | Respondent(s)                  | Application Title(s)                           |
            | 1               | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | Issue of liability order summons - council tax |
            | 2               | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | Collection Order - Financial Penalty Account   |
        Then User Should See Row In Table "To this applications list" With Values:
            | Date          | Time         | Location | Description         | Entries | Status   |
            | <DisplayDate> | <TargetTime> | <Court>  | <TargetDescription> | 0       | <Status> |
        When User Clicks On The "Continue" Button
        # ── Success: redirected to target list detail ────────────────────────────
        Then User See "Applications" On The Page
        Then User Sees Success Banner "Applications successfully moved" Containing "Applications have been successfully moved to the selected applications list"
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number  | Applicant                           | Respondent                     | Postcode | Title                                          | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | BS15 5AA | Issue of liability order summons - council tax | No  |          |
            | 2               | ACC-E2-{RANDOM} | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | B1 1AA   | Collection Order - Financial Penalty Account   | No  |          |
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:sourceListId"
        Then User Verify Response Status Code Should Be "204"
        When User Makes DELETE API Request To "/application-lists/:targetListId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | Time           | TargetTime     | Status | SourceDescription                    | TargetDescription                     | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                     |
            | user2 | todayiso | timenowhhmm-3h | timenowhhmm-4h | OPEN   | Source list to move at Test_{RANDOM} | Target list for move at Test_{RANDOM} | BCC026            | today      | todayDisplay | 3       | Bristol Crown Court Set 3 |

    @regression @applicationsList @ARCPOC-446 @PJ
    Scenario Outline: Application List - Move Selected Entries to a New List with Validation
        Given User Authenticates Via API As "<User>"
        # ── API setup: source list + entries ────────────────────────────────────
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time         | status   | description         | courtLocationCode   |
            | <APIDate> | <SourceTime> | <Status> | <SourceDescription> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "sourceListId"
        # Entry 1 - Person applicant + Person respondent (CT99002)
        When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | CT99002                        |
            | applicant.person.name.title                   | Mr                             |
            | applicant.person.name.surname                 | Taylor {RANDOM}                |
            | applicant.person.name.firstForename           | Henry                          |
            | applicant.person.name.secondForename          | James                          |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street           |
            | applicant.person.contactDetails.addressLine2  | Westminster                    |
            | applicant.person.contactDetails.addressLine3  | London                         |
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
            | respondent.person.contactDetails.postcode     | BS15 5AA                       |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-25y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-E1-{RANDOM}                |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        # Entry 2 - Person applicant + Organisation respondent (EF99001)
        When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
            | standardApplicantCode                               | null                           |
            | applicationCode                                     | EF99001                        |
            | applicant.person.name.title                         | Mrs                            |
            | applicant.person.name.surname                       | Johnson {RANDOM}               |
            | applicant.person.name.firstForename                 | Sarah                          |
            | applicant.person.name.secondForename                | Louise                         |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} High Street           |
            | applicant.person.contactDetails.addressLine2        | Manchester                     |
            | applicant.person.contactDetails.addressLine3        | Greater Manchester             |
            | applicant.person.contactDetails.postcode            | M1 1AA                         |
            | applicant.person.contactDetails.phone               | 0161{RANDOM}                   |
            | applicant.person.contactDetails.mobile              | 07700{RANDOM}                  |
            | applicant.person.contactDetails.email               | applicant{RANDOM}@example.com  |
            | respondent.organisation.name                        | Greenfield Consulting {RANDOM} |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Park Lane             |
            | respondent.organisation.contactDetails.addressLine2 | Birmingham                     |
            | respondent.organisation.contactDetails.addressLine3 | West Midlands                  |
            | respondent.organisation.contactDetails.postcode     | B1 1AA                         |
            | respondent.organisation.contactDetails.phone        | 0121{RANDOM}                   |
            | respondent.organisation.contactDetails.mobile       | 07800{RANDOM}                  |
            | wordingFields.0.key                                 | account balance                |
            | wordingFields.0.value                               | {RANDOM}                       |
            | hasOffsiteFee                                       | false                          |
            | caseReference                                       | CASE-{RANDOM}                  |
            | accountNumber                                       | ACC-E2-{RANDOM}                |
            | notes                                               | Case noted with ref {RANDOM}   |
            | lodgementDate                                       | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId2"
        # Entry 3 - Standard applicant APP036 + Person respondent (CT99002)
        When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
            | standardApplicantCode                         | APP036                         |
            | applicationCode                               | CT99002                        |
            | respondent.person.name.title                  | Mr                             |
            | respondent.person.name.surname                | Owen {RANDOM}                  |
            | respondent.person.name.firstForename          | Davies                         |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Station Road          |
            | respondent.person.contactDetails.addressLine2 | Leeds                          |
            | respondent.person.contactDetails.addressLine3 | West Yorkshire                 |
            | respondent.person.contactDetails.postcode     | LS1 1AA                        |
            | respondent.person.contactDetails.phone        | 0113{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07200{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-40y                   |
            | wordingFields.0.key                           | Reference                      |
            | wordingFields.0.value                         | {RANDOM}                       |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-E3-{RANDOM}                |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId3"
        # ── UI flow ─────────────────────────────────────────────────────────────
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description | CourtSearch         | Court   | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      |             | <courtLocationCode> | <Court> |        |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time         | Location | Description         | Entries   | Status   |
            | <DisplayDate> | <SourceTime> | <Court>  | <SourceDescription> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Should See The Button "Actions" Is Disabled
        # Select entries 1 and 2 to move
        When User Checks The Checkbox In Row Of Table "Entries" With:
            | Sequence number | Account number  | Applicant                           | Respondent                     | Postcode | Title                                          | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | BS15 5AA | Issue of liability order summons - council tax | No  |          |
            | 2               | ACC-E2-{RANDOM} | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | B1 1AA   | Collection Order - Financial Penalty Account   | No  |          |
        Then User Should See The Button "Actions" Is Enabled
        When User Clicks "Actions" Then "Move entries" From Caption Menu In Table "Entries"
        Then User See "Move applications" On The Page
        # Verify selected entries shown on Move page
        Then User Should See Row In Table "You are moving the following application(s)" With Values:
            | Sequence number | Applicant(s)                        | Respondent(s)                  | Application Title(s)                           |
            | 1               | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | Issue of liability order summons - council tax |
            | 2               | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | Collection Order - Financial Penalty Account   |
        # Navigate to Create new list form from Move page
        Then User Clicks On The Link "Create new list"
        # ── Validation checks on Create form ────────────────────────────────────
        When User Clicks On The "Create" Button
        Then User Sees Validation Error Banner "There is a problem Enter day, month and year Enter valid hours and minutes Description is required Enter a court, or an other location and criminal justice area"
        Then User Should See The Date Field "Date"
        When User Set Date Field "Date" To "<InvalidDate>"
        When User Clicks On The "Create" Button
        Then User Sees Validation Error Banner "There is a problem Enter a valid date Enter valid hours and minutes Description is required Enter a court, or an other location and criminal justice area"
        When User Set Date Field "Date" To "<SearchDate>"
        When User Clicks On The "Create" Button
        Then User Sees Validation Error Banner "There is a problem Enter valid hours and minutes Description is required Enter a court, or an other location and criminal justice area"
        Then User Should See The Time Field "Time"
        When User Set Time Field "Time" To "<InvalidTime>"
        When User Clicks On The "Create" Button
        Then User Sees Validation Error Banner "There is a problem Enter a valid duration between 00:00 and 23:59 Description is required Enter a court, or an other location and criminal justice area"
        Then User Should See The Time Field "Time"
        When User Set Time Field "Time" To "<NewListTime>"
        When User Clicks On The "Create" Button
        Then User Sees Validation Error Banner "There is a problem Description is required Enter a court, or an other location and criminal justice area"
        Then User Enters "<NewListDescription>" Into The "List description" Textbox
        When User Clicks On The "Create" Button
        Then User Sees Validation Error Banner "There is a problem Enter a court, or an other location and criminal justice area"
        Then User Enters "<OtherLocation>" Into The "Other location description" Textbox
        When User Clicks On The "Create" Button
        Then User Sees Validation Error Banner "Enter a court, or an other location and criminal justice area Criminal justice area is required"
        Then User Selects "<CJA>" From The Textbox "Criminal justice area" Autocomplete By Typing "<CJASearch>"
        When User Clicks On The "Create" Button
        # ── Move confirm page ────────────────────────────────────────────────────
        Then User See "Are you sure you want to move these applications to this application list?" On The Page
        Then User Should See Row In Table "You are moving the following application(s)" With Values:
            | Sequence number | Applicant(s)                        | Respondent(s)                  | Application Title(s)                           |
            | 1               | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | Issue of liability order summons - council tax |
            | 2               | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | Collection Order - Financial Penalty Account   |
        Then User Should See Row In Table "To this applications list" With Values:
            | Date          | Time          | Location        | Description          | Entries | Status |
            | <DisplayDate> | <NewListTime> | <OtherLocation> | <NewListDescription> | 0       | Open   |
        When User Clicks On The "Continue" Button
        # ── Success: redirected to target list detail ────────────────────────────
        Then User See "Applications" On The Page
        Then User Sees Success Banner "Applications successfully moved" Containing "Applications have been successfully moved to the selected applications list"
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number  | Applicant                           | Respondent                     | Postcode | Title                                          | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Mr, Henry James, Taylor {RANDOM}    | Ms, Emily Rose, Clark {RANDOM} | BS15 5AA | Issue of liability order summons - council tax | No  |          |
            | 2               | ACC-E2-{RANDOM} | Mrs, Sarah Louise, Johnson {RANDOM} | Greenfield Consulting {RANDOM} | B1 1AA   | Collection Order - Financial Penalty Account   | No  |          |
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:sourceListId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | APIDate  | SourceTime     | Status | SourceDescription                    | courtLocationCode | SearchDate | DisplayDate  | Entries | Court                     | InvalidDate | InvalidTime | NewListTime    | NewListDescription                     | OtherLocation           | CJA           | CJASearch |
            | user2 | todayiso | timenowhhmm-3h | OPEN   | Source list to move at Test_{RANDOM} | BCC026            | today      | todayDisplay | 3       | Bristol Crown Court Set 3 | 32/13/2024  | 25:61       | timenowhhmm-4h | New target list for move Test_{RANDOM} | Other Location_{RANDOM} | Wolverhampton | B9        |
