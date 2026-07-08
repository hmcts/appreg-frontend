Feature: Applications List Entry Notes Update

    Background: Create applications list entry
        Given User Authenticates Via API As "user1"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time  | status | description                 | courtLocationCode | durationHours | durationMinutes |
            | todayiso | 10:20 | OPEN   | Entry update Notes {RANDOM} | LCCC065           | 2             | 22              |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                                  |
            | applicationCode                               | MX99009                               |
            | applicant.person.name.title                   | Mr                                    |
            | applicant.person.name.lastName                | Taylor {RANDOM}                       |
            | applicant.person.name.firstName               | Henry                                 |
            | applicant.person.name.middleName              | James                                 |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street                  |
            | applicant.person.contactDetails.addressLine2  | Westminster                           |
            | applicant.person.contactDetails.addressLine3  | London                                |
            | applicant.person.contactDetails.addressLine4  | Greater London                        |
            | applicant.person.contactDetails.addressLine5  | United Kingdom                        |
            | applicant.person.contactDetails.postcode      | SW1A 1AA                              |
            | applicant.person.contactDetails.phone         | 0203{RANDOM}                          |
            | applicant.person.contactDetails.mobile        | 07123{RANDOM}                         |
            | applicant.person.contactDetails.email         | applicant{RANDOM}@example.com         |
            | respondent.person.name.title                  | Ms                                    |
            | respondent.person.name.lastName               | Clark {RANDOM}                        |
            | respondent.person.name.firstName              | Emily                                 |
            | respondent.person.name.middleName             | Rose                                  |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road                  |
            | respondent.person.contactDetails.addressLine2 | Bristol                               |
            | respondent.person.contactDetails.addressLine3 | Avon                                  |
            | respondent.person.contactDetails.addressLine4 | United Kingdom                        |
            | respondent.person.contactDetails.postcode     | BS15 5AA                              |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                          |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                         |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com        |
            | respondent.person.dateOfBirth                 | todayiso-25y                          |
            | feeStatuses.0.paymentReference                | REF-{RANDOM}                          |
            | feeStatuses.0.paymentStatus                   | PAID                                  |
            | feeStatuses.0.statusDate                      | todayiso                              |
            | hasOffsiteFee                                 | false                                 |
            | caseReference                                 | CASE-{RANDOM}                         |
            | accountNumber                                 | ACC-{RANDOM}                          |
            | notes                                         | Original Note noted with ref {RANDOM} |
            | officials.0.title                             | Mr                                    |
            | officials.0.surname                           | Turner {RANDOM}                       |
            | officials.0.forename                          | Graham                                |
            | officials.0.type                              | MAGISTRATE                            |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
            | resultCode | AUTH |
        Then User Verify Response Status Code Should Be "201"




    @regression @applicationListEntry @ARCPOC-1333 @JF
    Scenario: Expand and collapse update entry help details
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Given User Navigates To The URL "/applications-list/:listId#list-details"
        Then User Sees Page Heading "Applications list"
        Then User Selects "Closed" In The "status" Dropdown
        Then User Verifies "Closed" Is Selected In The "status" Dropdown
        When User Clicks On The "Update" Button
        Then User Sees Warning Alert "This action will close the list, and no further updates to the applications will be allowed"
        Then User See "Are you sure you want to close this application list?" On The Page
        When User Clicks On The "Continue" Button
        Then User Sees Success Banner "Success Application list closed successfully If you believe this was in error, please contact support."
        Given User Navigates To The URL "/applications"
        Then User Enters "Taylor {RANDOM}" Into The "Applicant surname" Textbox
        When User Clicks On The "Search" Button

