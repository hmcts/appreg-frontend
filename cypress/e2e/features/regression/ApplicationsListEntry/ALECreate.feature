Feature: Applications List Entry Create

  @applicationListEntry @regression @ARCPOC-222 @ARCPOC-427 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @SC1
  Scenario Outline: Create an ALE where Applicant = Person and Respondent = Person, using an Application Code with Fee Required = Y and Respondent Required = Y
    Given User Authenticates Via API As "<User>"
    # Create Application List
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time   | status   | description   | durationHours | durationMinutes | courtLocationCode |
      | todayiso | <Time> | <Status> | <Description> |               |                 | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    # Search Created Application List
    When User Searches Application List With:
      | Date         | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | <SearchDate> |      | <Description>    |             |       | <Status>           |                            |                       |           |
    When User Clicks "Select" Then "Open" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    ## Create Application under Application List
    Then User Clicks On The Link "Create application"
    When User Clicks On The "Show all sections" Button
    Then User Should See The Button "Hide all sections"
    # Applicant Details
    When User Fills In The Applicant Details
      | Select applicant type | Person                        |
      | Select title          | Dr                            |
      | First name            | John {RANDOM}                 |
      | Middle name(s)        | Michael                       |
      | Surname               | Smith {RANDOM}                |
      | Address line 1        | {RANDOM} High Street          |
      | Address line 2        | Apartment 4B                  |
      | Town or city          | Leeds                         |
      | County or region      | West Yorkshire                |
      | Post town             | Leeds                         |
      | Postcode              | LS10 1PJ                      |
      | Phone number          | 01632960001                   |
      | Mobile number         | 07700900001                   |
      | Email address         | applicant{RANDOM}@example.com |
    # Application Codes
    Then User Enters "<ApplicationCode>" Into The Textbox "Application code" In The Accordion "Codes"
    When User Clicks On The "Search" Button In The Accordion "Codes"
    Then User Verifies Table "Codes" Has Sortable Headers "Code, Title, Bulk, Fee required" In The Accordion "Codes"
    Then User Clicks "Add code" Button In Row Of Table "Codes" In The Accordion "Codes"
      | Code              | Title              | Bulk | Fee req |
      | <ApplicationCode> | <ApplicationTitle> | No   | CO8.1   |
    Then User Verifies The "Application Title" Textbox Has Value "<ApplicationTitle>"
    Then User Verifies The Date field "Lodgement date" Has Value "<SearchDate>"
    # Wording Details
    Then User Verifies The "Wording" Accordion Has Value "<WordingText>"
    Then User Verifies The "Wording" Accordion Has textbox with placeholder "<placeholder>" and Enters "<WordingValue>"
    # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
    When User Clicks On The "Apply wording" Button In The Accordion "Wording"
    Then User Sees Success Alert "Wording applied to this entry. Save the entry to keep these changes."
    # Respondent Details
    When User Fills In The Respondent Details
      | Select type      | Person                         |
      | Select title     | Mrs                            |
      | First name       | Jane                           |
      | Middle name(s)   | Elizabeth                      |
      | Surname          | Doe {RANDOM}                   |
      | Address line 1   | {RANDOM} Park Road             |
      | Address line 2   | Building C                     |
      | Town or city     | Leeds                          |
      | County or region | West Yorkshire                 |
      | Post town        | Leeds                          |
      | Postcode         | LS10 1PJ                       |
      | Phone number     | 01632960002                    |
      | Mobile number    | 07700900002                    |
      | Email address    | respondent{RANDOM}@example.com |
    # Civil Fee Details
    When User Verifies The Checkbox With Label "Off site fee applies" In The Accordion "Civil fee" Is Enabled
    Then User Should See The Text "Selecting this will apply the off site fee to the entry." In The Accordion "Civil fee"
    Then User Should See The Text "Fee Reference: CO8.1" In The Accordion "Civil fee"
    Then User Should See The Text "Amount: £284.00" In The Accordion "Civil fee"
    Then User Verifies The Checkbox With Label "Off site fee applies " In The Accordion "Civil fee" Is Unchecked
    Then User Checks The Checkbox With Label "Off site fee applies " In The Accordion "Civil fee"
    # Bug ARCPOC-1241 is raised
    Then User Should See The Text "Off Site Fee Amount: £30.00" In The Accordion "Civil fee"
    Then User Should See The Text "Total Fee Amount: £314.00" In The Accordion "Civil fee"
    Then User Should See The Text "Update fee status" In The Accordion "Civil fee"
    Then User Selects "Undertaken" From The Dropdown "Fee status" In The Accordion "Civil fee"
    Then User Enters "<SearchDate>" Into The Date Field "Status date" In The Accordion "Civil fee"
    Then User Enters "<PaymentReferenceUndertaken>" Into The Textbox "Payment reference" In The Accordion "Civil fee"
    When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
    Then User Verifies Table "Current fee statuses table" Has Sortable Headers "Fee Status, Status Date, Payment Ref" In The Accordion "Civil fee"
    Then User Clicks "Change" Link In Row Of Table "Current fee statuses table" In The Accordion "Civil fee"
      | Fee Status | Status Date  | Payment Ref                  |
      | UNDERTAKEN | todaydisplay | <PaymentReferenceUndertaken> |
    Then User Sees Page Heading "Change payment reference"
    Then User Should See Summary List Row With Key "Status" And Value "UNDERTAKEN"
    Then User Should See Summary List Row With Key "Status date" And Value "<DisplayDate>"
    Then User Verifies The "Payment reference" Textbox Has Value "<PaymentReferenceUndertaken>"
    Then User Clears The "Payment reference" Textbox
    Then User Enters "<UpdatedPaymentReferenceUndertaken>" Into The "Payment reference" Textbox
    When User Clicks On The "Save" Button
    Then User Should See Row In Table "Current fee statuses table" In The Accordion "Civil fee" With Values:
      | Fee Status | Status Date   | Payment Ref                         |
      | UNDERTAKEN | <DisplayDate> | <UpdatedPaymentReferenceUndertaken> |
    Then User Selects "Paid" From The Dropdown "Fee status" In The Accordion "Civil fee"
    Then User Enters "<SearchDate>" Into The Date Field "Status date" In The Accordion "Civil fee"
    Then User Enters "<PaymentReferencePaid>" Into The Textbox "Payment reference" In The Accordion "Civil fee"
    When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
    Then User Should See Row In Table "Current fee statuses table" In The Accordion "Civil fee" With Values:
      | Fee Status | Status Date   | Payment Ref                         |
      | UNDERTAKEN | <DisplayDate> | <UpdatedPaymentReferenceUndertaken> |
      | PAID       | <DisplayDate> | <PaymentReferencePaid>              |
    Then User Verifies "Change" Link Is Not Visible In Row Of Table In The Accordion "Civil fee" With:
      | Fee Status | Status Date   | Payment Ref                         |
      | UNDERTAKEN | <DisplayDate> | <UpdatedPaymentReferenceUndertaken> |
    Then User Verifies "Change" Link Is Visible In Row Of Table In The Accordion "Civil fee" With:
      | Fee Status | Status Date   | Payment Ref            |
      | PAID       | <DisplayDate> | <PaymentReferencePaid> |
    # Notes Details
    Then User Enters "<CaseReference>" Into The Textbox "Case reference" In The Accordion "Notes"
    Then User Enters "<AccountReference>" Into The Textbox "Account reference" In The Accordion "Notes"
    Then User Enters "This is a test application with special requirements" Into The Textbox "Application details" In The Accordion "Notes"
    # Submit Application Bug ARCPOC-1239 is raised for Wordind not retaining
    Then User Verifies The "Wording" Accordion Has textbox with placeholder "<placeholder>" and Enters "<WordingValue>"
    When User Clicks On The "Apply wording" Button In The Accordion "Wording"
    Then User Sees Success Alert "Wording applied to this entry. Save the entry to keep these changes."
    When User Clicks On The "Create entry" Button
    Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."
    Examples:
      | User  | TableName | SearchDate | DisplayDate  | Time  | Court                             | Description                             | Entries | Status | ApplicationCode | ApplicationTitle           | WordingText                                      | placeholder                  | WordingValue        | PaymentReferenceUndertaken | UpdatedPaymentReferenceUndertaken | PaymentReferencePaid | CaseReference | AccountReference |
      | user1 | Lists     | today      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   | MX99006         | Condemnation of Unfit Food | Application for the condemnation of food, namely | Enter a Describe Seized Food | Test Sample Wording | PAY-{RANDOM}               | New PAY-{RANDOM}                  | Paid PAY-{RANDOM}    | case{RANDOM}  | account{RANDOM}  |

  @applicationListEntry @regression @ARCPOC-222 @ARCPOC-427 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @SC2
  Scenario Outline: Create an ALE where Applicant = Organisation and Respondent = Organisation, using an Application Code with Fee Required = N and Respondent Required = Y
    Given User Authenticates Via API As "<User>"
    # Create Application List
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time   | status   | description   | durationHours | durationMinutes | courtLocationCode |
      | todayiso | <Time> | <Status> | <Description> | 2             | 22              | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    # Search Created Application List
    When User Searches Application List With:
      | Date         | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | <SearchDate> |      |                  |             |       | <Status>           |                            |                       |           |
    When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    ## Create Application under Application List
    Then User Clicks On The Link "Create application"
    When User Clicks On The "Show all sections" Button
    Then User Should See The Button "Hide all sections"
    # Applicant Details
    When User Fills In The Applicant Details
      | Select applicant type | Organisation                       |
      | Organisation name     | Test Sample Applicant Organisation |
      | Address line 1        | 123 High Street                    |
      | Address line 2        | Apartment 4B                       |
      | Town or city          | Leeds                              |
      | County or region      | West Yorkshire                     |
      | Post town             | Leeds                              |
      | Postcode              | LS10 1PJ                           |
      | Phone number          | 020 7946 0000                      |
      | Mobile number         | 07123 456789                       |
      | Email address         | john.smith@example.com             |
    # Application Codes
    Then User Enters "<ApplicationCode>" Into The Textbox "Application code" In The Accordion "Codes"
    When User Clicks On The "Search" Button In The Accordion "Codes"
    Then User Verifies Table "Codes" Has Sortable Headers "Code, Title, Bulk, Fee required" In The Accordion "Codes"
    Then User Clicks "Add code" Button In Row Of Table "Codes" In The Accordion "Codes"
      | Code              | Title              | Bulk | Fee req |
      | <ApplicationCode> | <ApplicationTitle> | No   | CO8.1   |
    Then User Verifies The "Application Title" Textbox Has Value "<ApplicationTitle>"
    Then User Verifies The Date field "Lodgement date" Has Value "<SearchDate>"
    # Wording Details
    Then User Verifies The "Wording" Accordion Has Value "<WordingText>"
    Then User Verifies The "Wording" Accordion Has textbox with placeholder "<placeholder>" and Enters "<WordingValue>"
    # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
    When User Clicks On The "Apply wording" Button In The Accordion "Wording"
    Then User Sees Success Alert "Wording applied to this entry. Save the entry to keep these changes."
    # Then User Should See The Link "Dismiss"
    # Respondent Details
    When User Fills In The Respondent Details
      | Select type       | Organisation                 |
      | Organisation name | Test Sample Res Organisation |
      | Address line 1    | 123 High Street              |
      | Address line 2    | Apartment 4B                 |
      | Town or city      | Leeds                        |
      | County or region  | West Yorkshire               |
      | Post town         | Leeds                        |
      | Postcode          | LS10 1PJ                     |
      | Phone number      | 020 7946 0000                |
      | Mobile number     | 07123 456789                 |
      | Email address     | john.smith@example.com       |
    # Civil Fee Details
    Then User Should See The Text "No fee required" In The Accordion "Civil fee"
    Then User Verifies Dropdown "Fee status" Is Disabled In The Accordion "Civil fee"
    Then User Verifies Date Field "Status date" Is Disabled In The Accordion "Civil fee"
    Then User Verifies The Textbox "Payment reference" Is Disabled In The Accordion "Civil fee"
    Then User Verifies The Button "Add fee details" Is Disabled In The Accordion "Civil fee"
    # Notes Details
    Then User Enters "<CaseReference>" Into The Textbox "Case reference" In The Accordion "Notes"
    Then User Enters "<AccountReference>" Into The Textbox "Account reference" In The Accordion "Notes"
    Then User Enters "This is a test application with special requirements" Into The Textbox "Application details" In The Accordion "Notes"
    # Submit Application
    When User Clicks On The "Create entry" Button
    Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."

    Examples:
      | User  | SearchDate | DisplayDate  | Time  | Court                             | Description                             | Entries | Status | SelectButtonText | ButtonName | ApplicationCode | ApplicationTitle                               | WordingText                                                                                                                                                        | placeholder       | WordingValue | TableName | CaseReference | AccountReference |
      | user1 | today      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   | Select           | Open       | CT99002         | Issue of liability order summons - council tax | Attends to swear a complaint for the issue of a summons for the debtor to answer an application for a liability order in relation to unpaid council tax (reference | Enter a Reference | TestRef-001  | Lists     | case12345     | account12345     |

  @applicationListEntry @regression @ARCPOC-222 @ARCPOC-427 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @SC3
  Scenario Outline: Create an ALE where Applicant = Standard Applicant, using an Application Code with Fee Required = Y and Respondent Required = N
    Given User Authenticates Via API As "<User>"
    # Create Application List
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time   | status   | description   | durationHours | durationMinutes | courtLocationCode |
      | todayiso | <Time> | <Status> | <Description> | 2             | 22              | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    # Search Created Application List
    When User Searches Application List With:
      | Date         | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | <SearchDate> |      |                  |             |       | <Status>           |                            |                       |           |
    When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    ## Create Application under Application List
    Then User Clicks On The Link "Create application"
    When User Clicks On The "Show all sections" Button
    Then User Should See The Button "Hide all sections"
    # Applicant Details - Standard Applicant
    Then User Selects "Standard Applicant" In The "Select applicant type" Dropdown
    Then User Enters "<StdAppCode>" Into The Textbox "Code" In The Accordion "Applicant"
    When User Clicks On The "Search" Button
    When User Checks The Checkbox In Row Of Table "Standard applicants" In The Accordion "Applicant" With:
      | Code         | Name         | Address         | Use from     | Use to |
      | <StdAppCode> | <StdAppName> | <StdAppAddress> | <StdAppFrom> | —      |
    # Application Codes
    Then User Enters "<ApplicationCode>" Into The Textbox "Application code" In The Accordion "Codes"
    When User Clicks On The "Search" Button In The Accordion "Codes"
    Then User Verifies Table "Codes" Has Sortable Headers "Code, Title, Bulk, Fee required" In The Accordion "Codes"
    Then User Clicks "Add code" Button In Row Of Table "Codes" In The Accordion "Codes"
      | Code              | Title              | Bulk | Fee req |
      | <ApplicationCode> | <ApplicationTitle> | No   | CO3.1   |
    Then User Verifies The "Application Title" Textbox Has Value "<ApplicationTitle>"
    Then User Verifies The Date field "Lodgement date" Has Value "<SearchDate>"
    # Wording Details
    Then User Verifies The "Wording" Accordion Has Value "<WordingText>"
    Then User Verifies The "Wording" Accordion Has textbox with placeholder "<placeholder>" and Enters "<WordingValue>"
    # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
    When User Clicks On The "Apply wording" Button In The Accordion "Wording"
    Then User Sees Success Alert "Wording applied to this entry. Save the entry to keep these changes."
    # Respondent Details Not provided as Respondent Required = N for the Application Code
    # Civil Fee Details
    When User Verifies The Checkbox With Label "Off site fee applies" In The Accordion "Civil fee" Is Enabled
    Then User Should See The Text "<OffsiteFeeString>" In The Accordion "Civil fee"
    Then User Should See The Text "<FeeReference>" In The Accordion "Civil fee"
    Then User Should See The Text "<FeeAmount>" In The Accordion "Civil fee"
    Then User Verifies The Checkbox With Label " Off site fee applies " In The Accordion "Civil fee" Is Unchecked
    Then User Checks The Checkbox With Label " Off site fee applies " In The Accordion "Civil fee"
    # Bug ARCPOC-1241 is raised
    # Then User Should See The Text "<OffisiteFeeCode>" In The Accordion "Civil fee"
    # Then User Should See The Text "<OffsiteFeeValue>" In The Accordion "Civil fee"
    # Then User Should See The Text "<TotalFeeAmount>" In The Accordion "Civil fee"
    Then User Selects "Paid" From The Dropdown "Fee status" In The Accordion "Civil fee"
    Then User Enters "<SearchDate>" Into The Date Field "Status date" In The Accordion "Civil fee"
    Then User Enters "<PaymentReference>" Into The Textbox "Payment reference" In The Accordion "Civil fee"
    When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
    # Notes Details
    Then User Enters "<CaseReference>" Into The Textbox "Case reference" In The Accordion "Notes"
    Then User Enters "<AccountReference>" Into The Textbox "Account reference" In The Accordion "Notes"
    Then User Enters "This is a test application with special requirements" Into The Textbox "Application details" In The Accordion "Notes"
    # Submit Application
    When User Clicks On The "Create entry" Button
    Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."

    Examples:
      | User  | TableName | SearchDate | DisplayDate  | Time  | Court                             | Description                             | Entries | Status | SelectButtonText | ButtonName | ApplicationCode | ApplicationTitle                                           | WordingText                                                                                                                     | placeholder  | WordingValue | PaymentReference | CaseReference | AccountReference | OffsiteFeeString                                         | OffsiteFeeCode | OffsiteFeeValue             | TotalFeeAmount            | FeeReference         | FeeAmount       | StdAppCode | StdAppName         | StdAppAddress  | StdAppFrom |
      | user1 | Lists     | today      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   | Select           | Open       | AP99004         | Request for Certificate of Refusal to State a Case (Civil) | Request for a certificate of refusal to state a case for the opinion of the High Court in respect of civil proceedings heard on | Enter a Date | today        | PAY-12345        | case12345     | account12345     | Selecting this will apply the off site fee to the entry. | CO1.1          | Off Site Fee Amount: £30.00 | Total Fee Amount: £135.00 | Fee Reference: CO3.1 | Amount: £105.00 | APP025     | Miss, Ava, Johnson | 258 Cedar Lane | 06/11/2025 |