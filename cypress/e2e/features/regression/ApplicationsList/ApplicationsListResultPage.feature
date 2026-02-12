Feature: Applications List Result

    @regression @ARCPOC-965 @PJ
    Scenario Outline: Application List - Result Selected
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | status   | description   | courtLocationCode   |
            | <DisplayDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
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
            | respondent.person.contactDetails.postcode     | BS1 5AA                        |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.dateOfBirth                        | todayiso-25y                   |
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
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description | CourtSearch         | Court   | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      |             | <courtLocationCode> | <Court> |        |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Should See The Button "Result selected" Is Disabled
        When User Checks The Checkbox In Row Of Table "Lists" With:
            | Sequence number | Account number | Applicant | Respondent | Post code | Title                                          | Fee req | Resulted |
            | 1               | ACC-{RANDOM}   |           |            | BS1 5AA   | Issue of liability order summons - council tax | No      | No       |
            | 1               | APP-62111      |           |            |           | Copy documents (electronic)                    | Yes     | No       |
        Then User Should See The Button "Result selected" Is Enabled
        When User Clicks On The "Result selected" Button
        Then User See "Result applications" On The Page
        Then User See "Applications to result" On The Page
        Then User Should See Row In Table "Applications to result" With Values:
            | Sequence number | Applicant(s) | Respondent(s) | Application Title(s)                           |
            | 1               |              |               | Issue of liability order summons - council tax |
            | 1               |              |               | Copy documents (electronic)                    |
        Then User Enters "test" Into The "Search for a result code" Textbox
        When User Clicks On The "Save" Button
        Examples:
            | User  | SearchDate | DisplayDate | Time           | courtLocationCode | Court                     | Description                             | Entries | Status |
            | user2 | today      | todayiso    | timenowhhmm-3h | BCC026            | Bristol Crown Court Set 3 | Applications to review at Test_{RANDOM} | 1       | OPEN   |
