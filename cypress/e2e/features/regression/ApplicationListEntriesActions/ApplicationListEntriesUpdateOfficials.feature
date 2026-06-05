Feature: Application List Entries Update Officials

    @regression @applicationsListEntries @ARCPOC-222 @ARCPOC-631
    Scenario Outline: Application List Entries - Update Officials
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Entry 1 - Person applicant + Person respondent (CT99002)
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | CT99002                        |
            | applicant.person.name.title                   | Mr                             |
            | applicant.person.name.lastName                | Taylor {RANDOM}                |
            | applicant.person.name.firstName               | Henry                          |
            | applicant.person.name.middleName              | James                          |
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
            | respondent.person.name.lastName               | Clark {RANDOM}                 |
            | respondent.person.name.firstName              | Emily                          |
            | respondent.person.name.middleName             | Rose                           |
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
            | accountNumber                                 | ACC-E1-{RANDOM}                |
            | notes                                         | Case noted with ref {RANDOM}   |
            | lodgementDate                                 | todayiso                       |
            | officials.0.title                             | Mr                             |
            | officials.0.surname                           | Turner {RANDOM}                |
            | officials.0.forename                          | Graham                         |
            | officials.0.type                              | MAGISTRATE                     |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        # Entry 2 - Person applicant + Organisation respondent (EF99001)
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                           |
            | applicationCode                                     | EF99001                        |
            | applicant.person.name.title                         | Mrs                            |
            | applicant.person.name.lastName                      | Johnson {RANDOM}               |
            | applicant.person.name.firstName                     | Sarah                          |
            | applicant.person.name.middleName                    | Louise                         |
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
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description | CourtSearch         | Court   | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      |             | <courtLocationCode> | <Court> |        |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Should See The Button "Actions" Is Disabled
        # Select all entries
        When User Checks The Select All Checkbox In Table "Entries"
        Then User Should See The Button "Actions" Is Enabled
        # Update Officials for Both Entries
        When User Clicks "Actions" Then "Update officials" From Caption Menu In Table "Entries"
        Then User Sees Page Heading "Update officials"
        And User Should See Row In Table "Application(s) to update" With Values:
            | Sequence number | Applicant(s)           | Respondent(s)                  | Application Title(s)                           |
            | 1               | Henry Taylor {RANDOM}  | Emily Clark {RANDOM}           | Issue of liability order summons - council tax |
            | 2               | Sarah Johnson {RANDOM} | Greenfield Consulting {RANDOM} | Collection Order - Financial Penalty Account   |

        Then User Selects "Mr" From The "Select magistrate's title" Dropdown Within The "Magistrate 1" FieldSet
        Then User Fills In The "Magistrate's first name" Textbox With "John" Within The "Magistrate 1" FieldSet
        Then User Fills In The "Magistrate's surname" Textbox With "Smith_{RANDOM}" Within The "Magistrate 1" FieldSet

        Then User Selects "Dr" From The "Select magistrate's title" Dropdown Within The "Magistrate 2" FieldSet
        Then User Fills In The "Magistrate's first name" Textbox With "Emily" Within The "Magistrate 2" FieldSet
        Then User Fills In The "Magistrate's surname" Textbox With "Davis_{RANDOM}" Within The "Magistrate 2" FieldSet

        Then User Selects "Miss" From The "Select magistrate's title" Dropdown Within The "Magistrate 3" FieldSet
        Then User Fills In The "Magistrate's first name" Textbox With "Jane" Within The "Magistrate 3" FieldSet
        Then User Fills In The "Magistrate's surname" Textbox With "Hardy_{RANDOM}" Within The "Magistrate 3" FieldSet

        Then User Selects "Mrs" From The "Select court official's title" Dropdown Within The "Court official" FieldSet
        Then User Fills In The "Official's first name" Textbox With "Violette" Within The "Court official" FieldSet
        Then User Fills In The "Official's surname" Textbox With "Zanetti_{RANDOM}" Within The "Court official" FieldSet
        When User Clicks On The "Save recording officials" Button
        Then User Sees Page Heading "Check officials before updating"
        Then User See "Officials" On The Page
        Then User Should See Summary List Row With Key "Magistrate 1" And Value "<Magistrate1Value1>"
        Then User Should See Summary List Row With Key "Magistrate 2" And Value "<Magistrate2Value1>"
        Then User Should See Summary List Row With Key "Magistrate 3" And Value "<Magistrate3Value1>"
        Then User Should See Summary List Row With Key "Court official" And Value "<CourtOfficialValue1>"
        When User Clicks On The "Confirm and update officials" Button
        Then User Sees Success Banner "Officials updated" Containing "The officials have been successfully updated"
        Examples:
            | User  | APIDate  | Time  | Status | Description                             | courtLocationCode | SearchDate | DisplayDate  | Court                     | Entries | Magistrate1Value1      | Magistrate2Value1       | Magistrate3Value1        | CourtOfficialValue1           |
            | user1 | todayiso | 10:20 | OPEN   | Applications to review at Test_{RANDOM} | BCC026            | today      | todaydisplay | Bristol Crown Court Set 3 | 2       | Mr John Smith_{RANDOM} | Dr Emily Davis_{RANDOM} | Miss Jane Hardy_{RANDOM} | Mrs Violette Zanetti_{RANDOM} |