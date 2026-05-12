Feature: Applications List Entry Update

    @applicationListEntry @regression @ARCPOC-222 @ARCPOC-428 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @SC1
    Scenario: Update an ALE where Applicant = Person and Respondent = Person, using an Application Code with Fee Required = Y and Respondent Required = Y
        Given User Authenticates Via API As "user1"
        # Create Application List
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time  | status | description                             | courtLocationCode |
            | todayiso | 10:20 | OPEN   | Applications to review at Test_{RANDOM} | LCCC065           |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Create Application List Entry - Person applicant + Person respondent, Application Code with Fee Required = Y and Respondent Required = Y
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | MX99006                        |
            | applicant.person.name.title                   | Mr                             |
            | applicant.person.name.surname                 | Taylor {RANDOM}                |
            | applicant.person.name.firstForename           | Henry                          |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street           |
            | applicant.person.contactDetails.addressLine2  | Westminster                    |
            | applicant.person.contactDetails.addressLine3  | London                         |
            | applicant.person.contactDetails.postcode      | SW1A 1AA                       |
            | applicant.person.contactDetails.phone         | 01632960001                    |
            | applicant.person.contactDetails.mobile        | 07700900001                    |
            | applicant.person.contactDetails.email         | applicant{RANDOM}@example.com  |
            | respondent.person.name.title                  | Ms                             |
            | respondent.person.name.surname                | Clark {RANDOM}                 |
            | respondent.person.name.firstForename          | Emily                          |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road           |
            | respondent.person.contactDetails.addressLine2 | Bristol                        |
            | respondent.person.contactDetails.postcode     | BS15 5AA                       |
            | respondent.person.contactDetails.phone        | 01632960001                    |
            | respondent.person.contactDetails.mobile       | 07700900001                    |
            | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-25y                   |
            | wordingFields.0.key                           | Describe Seized Food           |
            | wordingFields.0.value                         | {RANDOM}                       |
            | feeStatuses.0.paymentReference                | PAY-E5-{RANDOM}                |
            | feeStatuses.0.paymentStatus                   | PAID                           |
            | feeStatuses.0.statusDate                      | todayiso                       |
            | hasOffsiteFee                                 | false                          |
            | caseReference                                 | CASEE1{RANDOM}                 |
            | accountNumber                                 | ACCSE1{RANDOM}                 |
            | notes                                         | Entry search person person     |
            | lodgementDate                                 | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        # Search and Open Created Application List
        When User Searches Application List With:
            | Date  | Time | List description                        | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
            | today |      | Applications to review at Test_{RANDOM} |             |       | OPEN               |                            |                       |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date         | Time  | Location                          | Description                             | Entries | Status |
            | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 1       | OPEN   |
        # Search and Open Created Application List Entry
        When User Clicks "Open" Button In Row Of Table "Entries" With:
            | Sequence number | Account number | Applicant             | Respondent           | Postcode | Title                      | Fee | Resulted |
            | 1               | ACCSE1{RANDOM} | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | BS15 5AA | Condemnation of Unfit Food | Yes |          |
        When User Clicks On The "Show all sections" Button
        Then User Should See The Button "Hide all sections"
        Then User Sees Page Heading "Applications list entry update"
        Then User See "Summary of application list entry" On The Page
        #Result Wording
        Then User Selects "AUTH - Authorised" From The Textbox "Result code" Autocomplete By Typing "auth"
        Then User Should See Summary Card With Title "AUTH - Authorised"
        Then User Should See Tag "Pending" In Summary Card "AUTH - Authorised"
        Then User Should See The Link "Remove" In Summary Card "AUTH - Authorised"
        Then User Should See "Wording" In Summary Card "AUTH - Authorised"
        Then User Should See "Authorised." In Summary Card "AUTH - Authorised"
        When User Clicks On The "Apply result" Button
        Then User Sees Success Banner "Success Result updated The result has been updated for this application list entry."
        Then User Verifies The Button "Apply result" Is Disabled In The Accordion "Result wording"
        # Officials
        Then User Should Select "Mr" From The Dropdown "Select magistrate's title" Under "Magistrate 1" FieldSet In The Accordion "Officials"
        Then User Enters "John" In The Textbox "Magistrate's first name" Under "Magistrate 1" FieldSet In The Accordion "Officials"
        Then User Enters "Smith{RANDOM}" In The Textbox "Magistrate's surname" Under "Magistrate 1" FieldSet In The Accordion "Officials"

        Then User Should Select "Dr" From The Dropdown "Select magistrate's title" Under "Magistrate 2" FieldSet In The Accordion "Officials"
        Then User Enters "Emily" In The Textbox "Magistrate's first name" Under "Magistrate 2" FieldSet In The Accordion "Officials"
        Then User Enters "Davis{RANDOM}" In The Textbox "Magistrate's surname" Under "Magistrate 2" FieldSet In The Accordion "Officials"

        Then User Should Select "Miss" From The Dropdown "Select magistrate's title" Under "Magistrate 3" FieldSet In The Accordion "Officials"
        Then User Enters "Jane" In The Textbox "Magistrate's first name" Under "Magistrate 3" FieldSet In The Accordion "Officials"
        Then User Enters "Hardy{RANDOM}" In The Textbox "Magistrate's surname" Under "Magistrate 3" FieldSet In The Accordion "Officials"

        Then User Should Select "Mrs" From The Dropdown "Select court official's title" Under "Officials" FieldSet In The Accordion "Officials"
        Then User Enters "Violette" In The Textbox "Official's first name" Under "Officials" FieldSet In The Accordion "Officials"
        Then User Enters "Zanetti{RANDOM}" In The Textbox "Official's surname" Under "Officials" FieldSet In The Accordion "Officials"
        When User Clicks On The "Save recording officials" Button
        Then User Sees Success Banner "Success Officials updated Officials have been updated for this application list entry."
        When User Clicks On The "Save complete application" Button
        Then User Sees Success Banner "Success Application list entry updated The application list entry has been updated successfully."
