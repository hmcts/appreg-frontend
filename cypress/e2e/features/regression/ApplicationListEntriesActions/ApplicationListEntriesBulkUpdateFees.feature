Feature: Application List Entries Bulk Update Fees

    @regression @applicationsListEntries @ARCPOC-222 @ARCPOC-630 @ARCPOC-1475
    Scenario Outline: Application List Entries - Bulk Update Fees - 3 ALEs with Fee Required = Y and Respondent Required = Y
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Entry 1 - Person applicant + Person respondent + Application Code with Fee Required = Y and Respondent Required = Y (MX99006)
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | MX99006                        |
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
            | wordingFields.0.key                           | Describe Seized Food           |
            | wordingFields.0.value                         | {RANDOM}                       |
            | feeStatuses.0.paymentReference                | PAYA{RANDOM}                   |
            | feeStatuses.0.paymentStatus                   | UNDERTAKEN                     |
            | feeStatuses.0.statusDate                      | todayiso                       |
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
        # Entry 2 - Person applicant + Organisation respondent (MX99009) with Fee Required = Y and Respondent Required = Y
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                           |
            | applicationCode                                     | MX99009                        |
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
            | respondent.organisation.contactDetails.email        | respondent{RANDOM}@example.com |
            | feeStatuses.0.paymentStatus                         | DUE                            |
            | feeStatuses.0.statusDate                            | todayiso                       |
            | hasOffsiteFee                                       | false                          |
            | caseReference                                       | CASE-{RANDOM}                  |
            | accountNumber                                       | ACC-E2-{RANDOM}                |
            | notes                                               | Case noted with ref {RANDOM}   |
            | lodgementDate                                       | todayiso                       |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId2"
        # Entry 3 - Person applicant + Person respondent + Application Code with Fee Required = N and Respondent Required = Y (MX99011)
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                         |
            | applicationCode                               | MX99011                      |
            | applicant.person.name.title                   | Mr                           |
            | applicant.person.name.lastName                | Brown {RANDOM}               |
            | applicant.person.name.firstName               | Michael                      |
            | applicant.person.name.middleName              | David                        |
            | applicant.person.contactDetails.addressLine1  | {RANDOM} Church Street       |
            | applicant.person.contactDetails.addressLine2  | Liverpool                    |
            | applicant.person.contactDetails.addressLine3  | Merseyside                   |
            | applicant.person.contactDetails.postcode      | L1 1AA                       |
            | applicant.person.contactDetails.phone         | 0151{RANDOM}                 |
            | applicant.person.contactDetails.mobile        | 07900{RANDOM}                |
            | applicant.person.contactDetails.email         |                              |
            | respondent.person.name.title                  | Ms                           |
            | respondent.person.name.lastName               | Clark {RANDOM}               |
            | respondent.person.name.firstName              | Emily                        |
            | respondent.person.name.middleName             | Rose                         |
            | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road         |
            | respondent.person.contactDetails.addressLine2 | Bristol                      |
            | respondent.person.contactDetails.addressLine3 | Avon                         |
            | respondent.person.contactDetails.postcode     | BS15 5AA                     |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                 |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                |
            | respondent.person.contactDetails.email        |                              |
            | respondent.person.dateOfBirth                 | todayiso-25y                 |
            | wordingFields.0.key                           | Reference                    |
            | wordingFields.0.value                         | {RANDOM}                     |
            | feeStatuses.0.paymentReference                | PAYC{RANDOM}                 |
            | feeStatuses.0.paymentStatus                   | REMITTED                     |
            | feeStatuses.0.statusDate                      | todayiso                     |
            | hasOffsiteFee                                 | false                        |
            | caseReference                                 | CASE-{RANDOM}                |
            | accountNumber                                 | ACC-E3-{RANDOM}              |
            | notes                                         | Case noted with ref {RANDOM} |
            | lodgementDate                                 | todayiso                     |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId3"
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
        When User Checks The Checkbox In Row Of Table "Entries" With:
            | Sequence number | Account number  | Applicant              | Respondent                     | Postcode | Title                                                              | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Henry Taylor {RANDOM}  | Emily Clark {RANDOM}           | BS15 5AA | Condemnation of Unfit Food                                         | Yes |          |
            | 2               | ACC-E2-{RANDOM} | Sarah Johnson {RANDOM} | Greenfield Consulting {RANDOM} | B1 1AA   | Application for order re public health measures (person)           | Yes |          |
            | 3               | ACC-E3-{RANDOM} | Michael Brown {RANDOM} | Emily Clark {RANDOM}           | BS15 5AA | Application to remove an educational institution from the register | Yes |          |
        Then User Should See The Button "Actions" Is Enabled
        # Update Fees for Three Create Entreis where Fee Required = Y and Respondent Required = Y (MX99006, MX99009, MX99011)
        When User Clicks "Actions" Then "Update fee details" From Caption Menu In Table "Entries"
        Then User Sees Page Heading "Update fee details"
        And User Should See Row In Table "Updating fees for the following application(s)" With Values:
            | Applicant              | Respondent                     | Application title                                                  | Fee required | Resulted |
            | Henry Taylor {RANDOM}  | Emily Clark {RANDOM}           | Condemnation of Unfit Food                                         | Yes          |          |
            | Sarah Johnson {RANDOM} | Greenfield Consulting {RANDOM} | Application for order re public health measures (person)           | Yes          |          |
            | Michael Brown {RANDOM} | Emily Clark {RANDOM}           | Application to remove an educational institution from the register | Yes          |          |
        When User Checks The Checkbox With Label "Off site fee applies"
        Then User See "Selecting this will apply the off site fee to the entries." On The Page
        And User See "No fees exist" On The Page
        And User See "Update fee status" On The Page
        Then User Selects "Paid" In The "Fee status" Dropdown
        When User Set Date Field "Status date" To "<SearchDate>"
        Then User Enters "<PaymentReference>" Into The "Payment reference" Textbox
        Then User Should See The Button "Update fee details" Is Disabled
        When User Clicks On The "Add fee details" Button
        Then User Should See The Button "Update fee details" Is Enabled
        When User Clicks "Change" Link In Row Of Table "Current fee statuses table" With:
            | Fee Status | Status Date  | Payment Ref  |
            | PAID       | todaydisplay | PAYD{RANDOM} |
        Then User Sees Page Heading "Change payment reference"
        Then User Should See Summary List Row With Key "Status" And Value "PAID"
        Then User Should See Summary List Row With Key "Status date" And Value "todaydisplay"
        Then User Verifies The "Payment reference" Textbox Has Value "<PaymentReference>"
        Then User Clears The "Payment reference" Textbox
        Then User Enters "PAY-{RANDOM}" Into The "Payment reference" Textbox
        When User Clicks On The "Save" Button
        Then User Should See Row In Table "Current fee statuses table" With Values:
            | Fee Status | Status Date  | Payment Ref  |
            | PAID       | todaydisplay | PAY-{RANDOM} |
        Then User Sees Page Heading "Update fee details"
        Then User Should See Row In Table "Updating fees for the following application(s)" With Values:
            | Applicant              | Respondent                     | Application title                                                  | Fee required | Resulted |
            | Henry Taylor {RANDOM}  | Emily Clark {RANDOM}           | Condemnation of Unfit Food                                         | Yes          |          |
            | Sarah Johnson {RANDOM} | Greenfield Consulting {RANDOM} | Application for order re public health measures (person)           | Yes          |          |
            | Michael Brown {RANDOM} | Emily Clark {RANDOM}           | Application to remove an educational institution from the register | Yes          |          |
        Then User Should See Row In Table "Current fee statuses table" With Values:
            | Fee Status | Status Date  | Payment Ref  |
            | PAID       | todaydisplay | PAY-{RANDOM} |
        When User Clicks On The "Update fee details" Button
        Then User See "Are you sure you want to add these fees to the following applications?" On The Page
        When User Clicks On The "Continue" Button
        Then User Sees Success Banner "Fees updated" Containing "Fees have been successfully updated"
        When User Clicks "Open" Button In Row Of Table "Entries" With:
            | Sequence number | Account number  | Applicant             | Respondent           | Postcode | Title                      | Fee | Resulted |
            | 1               | ACC-E1-{RANDOM} | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | BS15 5AA | Condemnation of Unfit Food | Yes |          |
        Then User Sees Page Heading "Applications list entry update"
        When User Clicks On The "Show all sections" Button
        Then User Should See Row In Table "Current fee statuses table" In The Accordion "Civil fee" With Values:
            | Fee Status | Status Date  | Payment Ref  |
            | UNDERTAKEN | todaydisplay | PAYA{RANDOM} |
            | PAID       | todaydisplay | PAY-{RANDOM} |
        Then User Verifies "Change" Link Is Not Visible In Row Of Table In The Accordion "Civil fee" With:
            | Fee Status | Status Date  | Payment Ref  |
            | UNDERTAKEN | todaydisplay | PAYA{RANDOM} |
        Then User Verifies "Change" Link Is Visible In Row Of Table In The Accordion "Civil fee" With:
            | Fee Status | Status Date  | Payment Ref  |
            | PAID       | todaydisplay | PAY-{RANDOM} |
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"

        Examples:
            | User  | SearchDate | APIDate  | Time  | Status | Description                             | courtLocationCode | SearchDate | DisplayDate  | Court                     | Entries | PaymentReference |
            | user1 | today      | todayiso | 10:20 | OPEN   | Applications to review at Test_{RANDOM} | BCC026            | today      | todaydisplay | Bristol Crown Court Set 3 | 3       | PAYD{RANDOM}     |

    @regression @applicationsListEntries @ARCPOC-222 @ARCPOC-630
    Scenario Outline: Application List Entries - Bulk Update Fees - 2 ALEs with Fee Required = N and Respondent Required = Y
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        # Entry 1 - Person applicant + Person respondent + Application Code with Fee Required = Y and Respondent Required = Y (AP99001)
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                              |
            | applicationCode                                     | AP99001                           |
            | applicant.person.name.title                         | Mr                                |
            | applicant.person.name.lastName                      | Harris {RANDOM}                   |
            | applicant.person.name.firstName                     | Oliver                            |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} Queen Street             |
            | applicant.person.contactDetails.addressLine2        | Edinburgh                         |
            | applicant.person.contactDetails.postcode            | EH1 1AA                           |
            | applicant.person.contactDetails.phone               | 01314{RANDOM}                     |
            | applicant.person.contactDetails.mobile              | 07900{RANDOM}                     |
            | applicant.person.contactDetails.email               | applicant.buf1.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Harris Holdings {RANDOM}          |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Victoria Road            |
            | respondent.organisation.contactDetails.addressLine2 | Cardiff                           |
            | respondent.organisation.contactDetails.postcode     | CF1 1AA                           |
            | respondent.organisation.contactDetails.phone        | 02924{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07910{RANDOM}                     |
            | respondent.organisation.contactDetails.email        | respondent.buf1.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Date of Hearing                   |
            | wordingFields.0.value                               | today                             |
            | hasOffsiteFee                                       | false                             |
            | caseReference                                       | CASE-E5-{RANDOM}                  |
            | accountNumber                                       | ACC-E5-{RANDOM}                   |
            | notes                                               | E5 Person+Org no fee              |
            | lodgementDate                                       | todayiso                          |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId1"
        # Entry 2 - Person applicant + Organisation respondent (AP99002) with Fee Required = N and Respondent Required = Y
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                               | null                              |
            | applicationCode                                     | AP99002                           |
            | applicant.person.name.title                         | Mr                                |
            | applicant.person.name.lastName                      | Smith {RANDOM}                    |
            | applicant.person.name.firstName                     | John                              |
            | applicant.person.contactDetails.addressLine1        | {RANDOM} Queen Street             |
            | applicant.person.contactDetails.addressLine2        | Edinburgh                         |
            | applicant.person.contactDetails.postcode            | EH1 1AA                           |
            | applicant.person.contactDetails.phone               | 01314{RANDOM}                     |
            | applicant.person.contactDetails.mobile              | 07900{RANDOM}                     |
            | applicant.person.contactDetails.email               | applicant.buf2.{RANDOM}@test.com  |
            | respondent.organisation.name                        | Smith Holdings {RANDOM}           |
            | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Victoria Road            |
            | respondent.organisation.contactDetails.addressLine2 | Cardiff                           |
            | respondent.organisation.contactDetails.postcode     | CF1 1AA                           |
            | respondent.organisation.contactDetails.phone        | 02924{RANDOM}                     |
            | respondent.organisation.contactDetails.mobile       | 07910{RANDOM}                     |
            | respondent.organisation.contactDetails.email        | respondent.buf2.{RANDOM}@test.com |
            | wordingFields.0.key                                 | Date of Hearing                   |
            | wordingFields.0.value                               | today                             |
            | hasOffsiteFee                                       | false                             |
            | caseReference                                       | CASE-E6-{RANDOM}                  |
            | accountNumber                                       | ACC-E6-{RANDOM}                   |
            | notes                                               | E6 Person+Org no offsite fee      |
            | lodgementDate                                       | todayiso                          |
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
        When User Checks The Checkbox In Row Of Table "Entries" With:
            | Sequence number | Account number  | Applicant              | Respondent               | Postcode | Title                         | Fee | Resulted |
            | 1               | ACC-E5-{RANDOM} | Oliver Harris {RANDOM} | Harris Holdings {RANDOM} | CF1 1AA  | Appeal to Crown Court         | No  |          |
            | 2               | ACC-E6-{RANDOM} | John Smith {RANDOM}    | Smith Holdings {RANDOM}  | CF1 1AA  | Appeal by Case Stated (Crime) | No  |          |
        Then User Should See The Button "Actions" Is Enabled
        # Update Fees for Three Create Entreis where Fee Required = N and Respondent Required = Y (AP99001, AP99002)
        When User Clicks "Actions" Then "Update fee details" From Caption Menu In Table "Entries"
        Then User Sees Validation Error Banner "There is a problem Cannot update application(s) that do not require a fee"

        Examples:
            | User  | SearchDate | APIDate  | Time  | Status | Description                             | courtLocationCode | SearchDate | DisplayDate  | Court                     | Entries | PaymentReference |
            | user1 | today      | todayiso | 10:20 | OPEN   | Applications to review at Test_{RANDOM} | BCC026            | today      | todaydisplay | Bristol Crown Court Set 3 | 2       | PAYD{RANDOM}     |