Feature: Application List Entry Delete

    @regression @applicationsListEntry @ARCPOC-1281
    Scenario Outline: Delete an application from the list
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Entry 1 - Person applicant + Person respondent (CT99002)
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | AP99001                        |
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
            | wordingFields.0.key                           | Date of Hearing                |
            | wordingFields.0.value                         | "{RANDOM}"                     |
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
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description | CourtSearch         | Court   | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      |             | <courtLocationCode> | <Court> |        |                |     |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications" On The Page
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number  | Applicant             | Respondent           | Postcode | Title                 | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | BS15 5AA | Appeal to Crown Court | No  |          |
        When User Clicks "Select" Then "Delete" From Menu In Row Of Table "Entries" With:
            | Sequence number | Account number  | Applicant             | Respondent           | Postcode | Title                 | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | BS15 5AA | Appeal to Crown Court | No  |          |
        Then User Sees Warning Alert "You are about to delete this application. This action cannot be undone."
        Then User See "Are you sure you want to delete this application?" On The Page
        Then User Should See Row In Table With Values:
            | Sequence number | Account number  | Applicant             | Respondent           | Postcode | Title                 | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | BS15 5AA | Appeal to Crown Court | No  |          |
        Then User Clicks On The Link "Cancel"
        Then User See "Applications" On The Page
        Then User Should See Row In Table "Entries" With Values:
            | Sequence number | Account number  | Applicant             | Respondent           | Postcode | Title                 | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | BS15 5AA | Appeal to Crown Court | No  |          |
        When User Clicks "Select" Then "Delete" From Menu In Row Of Table "Entries" With:
            | Sequence number | Account number  | Applicant             | Respondent           | Postcode | Title                 | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | BS15 5AA | Appeal to Crown Court | No  |          |
        When User Clicks On The "Yes - delete" Button
        Then User Sees Success Banner "Application deleted" Containing "Application has been successfully deleted"
        Then User See "Applications" On The Page
        Then User Sees Inline Notification Banner "Important No lists entries found Try again, or create a new list entry"

        Examples:
            | User  | APIDate  | Time  | Status | Description      | courtLocationCode | SearchDate | DisplayDate  | Court                             | Entries |
            | user1 | todayiso | 10:00 | OPEN   | Test Application | LCCC025           | today      | todaydisplay | Leeds Combined Court Centre Set 3 | 1       |