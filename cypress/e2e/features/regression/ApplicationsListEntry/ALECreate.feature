Feature: Applications List Entry Create

  @applicationListEntry @regression @ARCPOC-222 @ARCPOC-427 @ARCPOC-635 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @SC1
  Scenario: Create an ALE where Applicant = Person and Respondent = Person, using an Application Code with Fee Required = Y and Respondent Required = Y
    Given User Authenticates Via API As "user1"
    # Create Application List
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                             | durationHours | durationMinutes | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Applications to review at Test_{RANDOM} |               |                 | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    # Search Created Application List
    When User Searches Application List With:
      | Date  | Time | List description                        | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | today |      | Applications to review at Test_{RANDOM} |             |       | OPEN               |                            |                       |           |
    When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
      | Date         | Time  | Location                          | Description                             | Entries | Status |
      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   |
    ## Create Application under Application List
    Then User Clicks On The Link "Create application"
    When User Clicks On The "Show all sections" Button
    Then User Should See The Button "Hide all sections"
    # Applicant Details
    When User Fills In The Applicant Details
      | Select applicant type | Person                        |
      | Select title          | Dr                            |
      | First name            | John                          |
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
    Then User Enters "MX99006" Into The Textbox "Application code" In The Accordion "Application codes"
    When User Clicks On The "Search" Button In The Accordion "Application codes"
    Then User Verifies Table "Codes" Has Sortable Headers "Code, Title, Bulk, Fee required" In The Accordion "Application codes"
    Then User Clicks "Add code" Button In Row Of Table "Codes" In The Accordion "Application codes"
      | Code    | Title                      | Bulk | Fee required |
      | MX99006 | Condemnation of Unfit Food | No   | Yes          |
    Then User Verifies The "Application Title" Textbox Has Value "Condemnation of Unfit Food"
    Then User Verifies The Date field "Lodgement date" Has Value "today"
    # Wording Details
    Then User Verifies The "Wording" Accordion Has Value "Application for the condemnation of food, namely"
    Then User Verifies The "Wording" Accordion Has textbox with placeholder "Enter a Describe Seized Food" and Enters "Test Sample Wording"
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
      | Date of birth    | today-30y                      |
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
    Then User Should See The Text "Off Site Fee Reference: CO1.1" In The Accordion "Civil fee"
    Then User Should See The Text "Off Site Fee Amount: £30.00" In The Accordion "Civil fee"
    Then User Should See The Text "Total Fee Amount: £314.00" In The Accordion "Civil fee"
    Then User Should See The Text "Update fee status" In The Accordion "Civil fee"
    Then User Selects "Undertaken" From The Dropdown "Fee status" In The Accordion "Civil fee"
    Then User Enters "today" Into The Date Field "Status date" In The Accordion "Civil fee"
    Then User Enters "PAY-{RANDOM}" Into The Textbox "Payment reference" In The Accordion "Civil fee"
    When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
    Then User Verifies Table "Current fee statuses table" Has Sortable Headers "Fee Status, Status Date, Payment Ref" In The Accordion "Civil fee"
    Then User Clicks "Change" Link In Row Of Table "Current fee statuses table" In The Accordion "Civil fee"
      | Fee Status | Status Date  | Payment Ref  |
      | UNDERTAKEN | todaydisplay | PAY-{RANDOM} |
    Then User Sees Page Heading "Change payment reference"
    Then User Should See Summary List Row With Key "Status" And Value "UNDERTAKEN"
    Then User Should See Summary List Row With Key "Status date" And Value "todaydisplay"
    Then User Verifies The "Payment reference" Textbox Has Value "PAY-{RANDOM}"
    Then User Clears The "Payment reference" Textbox
    Then User Enters "New PAY-{RANDOM}" Into The "Payment reference" Textbox
    When User Clicks On The "Save" Button
    Then User Should See Row In Table "Current fee statuses table" In The Accordion "Civil fee" With Values:
      | Fee Status | Status Date  | Payment Ref      |
      | UNDERTAKEN | todaydisplay | New PAY-{RANDOM} |
    Then User Selects "Paid" From The Dropdown "Fee status" In The Accordion "Civil fee"
    Then User Enters "today" Into The Date Field "Status date" In The Accordion "Civil fee"
    Then User Enters "Paid PAY-{RANDOM}" Into The Textbox "Payment reference" In The Accordion "Civil fee"
    When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
    Then User Should See Row In Table "Current fee statuses table" In The Accordion "Civil fee" With Values:
      | Fee Status | Status Date  | Payment Ref       |
      | UNDERTAKEN | todaydisplay | New PAY-{RANDOM}  |
      | PAID       | todaydisplay | Paid PAY-{RANDOM} |
    Then User Verifies "Change" Link Is Not Visible In Row Of Table In The Accordion "Civil fee" With:
      | Fee Status | Status Date  | Payment Ref      |
      | UNDERTAKEN | todaydisplay | New PAY-{RANDOM} |
    Then User Verifies "Change" Link Is Visible In Row Of Table In The Accordion "Civil fee" With:
      | Fee Status | Status Date  | Payment Ref       |
      | PAID       | todaydisplay | Paid PAY-{RANDOM} |
    # Notes Details
    Then User Enters "case{RANDOM}" Into The Textbox "Case reference" In The Accordion "Notes"
    Then User Enters "account{RANDOM}" Into The Textbox "Account reference" In The Accordion "Notes"
    Then User Enters "This is a test application with special requirements" Into The Textbox "Application details" In The Accordion "Notes"
    # Submit Application Bug ARCPOC-1239 is raised for Wording not retaining changes
    Then User Verifies The Textbox "" Contains "Test Sample Wording" In The Accordion "Wording"
    Then User Verifies The "Wording" Accordion Has textbox with placeholder "Enter a Describe Seized Food" and Enters "Test Sample Wording"
    When User Clicks On The "Apply wording" Button In The Accordion "Wording"
    Then User Sees Success Alert "Wording applied to this entry. Save the entry to keep these changes."
    When User Clicks On The "Create entry" Button
    Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."

    # ---------------OPEN APPLICATION LIST ENTRY---------------@ARCPOC-635 SC1

    Then User Clicks On The Breadcrumb Link "Applications list details"
    When User Clicks "Open" Button In Row Of Table "Entries" With:
      | Sequence number | Account number  | Applicant           | Respondent        | Postcode | Title                      | Fee | Resulted |
      | 1               | account{RANDOM} | John Smith {RANDOM} | Jane Doe {RANDOM} | LS10 1PJ | Condemnation of Unfit Food | Yes |          |
    When User Clicks On The "Show all sections" Button
    Then User Should See The Button "Hide all sections"
    Then User Sees Page Heading "Applications list entry update"
    Then User See "Summary of application list entry" On The Page
    # Verify Applicant Details
    When User Verifies In The Applicant Details
      | Select type      | Person                        |
      | Select title     | Dr                            |
      | First name       | John                          |
      | Middle name(s)   | Michael                       |
      | Surname          | Smith {RANDOM}                |
      | Address line 1   | {RANDOM} High Street          |
      | Address line 2   | Apartment 4B                  |
      | Town or city     | Leeds                         |
      | County or region | West Yorkshire                |
      | Post town        | Leeds                         |
      | Postcode         | LS10 1PJ                      |
      | Phone number     | 01632960001                   |
      | Mobile number    | 07700900001                   |
      | Email address    | applicant{RANDOM}@example.com |

    # Verify Application Codes Details
    Then User Verifies The Textbox "Application code" Contains "MX99006" In The Accordion "Application codes"
    Then User Verifies The Textbox "Application title" Contains "Condemnation of Unfit Food" In The Accordion "Application codes"
    Then User Verifies The Date field "Lodgement date" Has Value "today"
    Then User Verifies Date Field "Lodgement date" Is Disabled In The Accordion "Application codes"
    # Verify Wording Details
    Then User Verifies The "Wording" Accordion Has Value "Application for the condemnation of food, namely"
    Then User Verifies The Textbox "" Contains "Test Sample Wording" In The Accordion "Wording"
    # Verify Respondent Details
    When User Verifies In The Respondent Details
      | Select type      | Person                         |
      | Select title     | Mrs                            |
      | First name       | Jane                           |
      | Middle name(s)   | Elizabeth                      |
      | Surname          | Doe {RANDOM}                   |
      | Date of birth    | today-30y                      |
      | Address line 1   | {RANDOM} Park Road             |
      | Address line 2   | Building C                     |
      | Town or city     | Leeds                          |
      | County or region | West Yorkshire                 |
      | Post town        | Leeds                          |
      | Postcode         | LS10 1PJ                       |
      | Phone number     | 01632960002                    |
      | Mobile number    | 07700900002                    |
      | Email address    | respondent{RANDOM}@example.com |
    # Verify Civil Fee Details
    Then User Verifies The Checkbox With Label "Off site fee applies" In The Accordion "Civil fee" Is Checked
    Then User Should See The Text "Selecting this will automatically apply the off site fee to the entry. This change is saved immediately." In The Accordion "Civil fee"
    Then User Should See The Text "Fee Reference: CO8.1" In The Accordion "Civil fee"
    Then User Should See The Text "Amount: £284.00" In The Accordion "Civil fee"
    Then User Should See The Text "Off Site Fee Reference: CO1.1" In The Accordion "Civil fee"
    Then User Should See The Text "Off Site Fee Amount: £30.00" In The Accordion "Civil fee"
    Then User Should See The Text "Total Fee Amount: £314.00" In The Accordion "Civil fee"
    Then User Should See Row In Table "Current fee statuses table" In The Accordion "Civil fee" With Values:
      | Fee Status | Status Date  | Payment Ref       |
      | UNDERTAKEN | todaydisplay | New PAY-{RANDOM}  |
      | PAID       | todaydisplay | Paid PAY-{RANDOM} |
    Then User Verifies "Change" Link Is Not Visible In Row Of Table In The Accordion "Civil fee" With:
      | Fee Status | Status Date  | Payment Ref      |
      | UNDERTAKEN | todaydisplay | New PAY-{RANDOM} |
    Then User Verifies "Change" Link Is Visible In Row Of Table In The Accordion "Civil fee" With:
      | Fee Status | Status Date  | Payment Ref       |
      | PAID       | todaydisplay | Paid PAY-{RANDOM} |

    # Verify Notes Details
    Then User Verifies The Textbox "Case reference" Contains "case{RANDOM}" In The Accordion "Notes"
    Then User Verifies The Textbox "Account reference" Contains "account{RANDOM}" In The Accordion "Notes"
    Then User Verifies The Textbox "Application details" Contains "This is a test application with special requirements" In The Accordion "Notes"
    # Result Wording Details
    Then User Should See Row In Table "You are resulting the following application(s)" In The Accordion "Result wording" With Values:
      | Applicant(s)        | Respondent(s)     | Application title(s)       |
      | John Smith {RANDOM} | Jane Doe {RANDOM} | Condemnation of Unfit Food |
    Then User Verifies The Textbox "Result code" In The Accordion "Result wording" Is Empty
    Then User Verifies The Button "Apply result" Is Disabled In The Accordion "Result wording"
    # Officials Details
    Then User Verifies Dropdown "Select magistrate's title" Is Visible Under "Magistrate 1" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's first name" Under "Magistrate 1" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's surname" Under "Magistrate 1" FieldSet In The Accordion "Officials"

    Then User Verifies Dropdown "Select magistrate's title" Is Visible Under "Magistrate 2" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's first name" Under "Magistrate 2" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's surname" Under "Magistrate 2" FieldSet In The Accordion "Officials"

    Then User Verifies Dropdown "Select magistrate's title" Is Visible Under "Magistrate 3" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's first name" Under "Magistrate 3" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's surname" Under "Magistrate 3" FieldSet In The Accordion "Officials"

    Then User Verifies Dropdown "Select court official's title" Is Visible Under "Officials" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Official's first name" Under "Officials" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Official's surname" Under "Officials" FieldSet In The Accordion "Officials"

  @applicationListEntry @regression @ARCPOC-222 @ARCPOC-427 @ARCPOC-635 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @SC2
  Scenario Outline: Create an ALE where Applicant = Organisation and Respondent = Organisation, using an Application Code with Fee Required = N and Respondent Required = Y
    Given User Authenticates Via API As "user1"
    # Create Application List
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                             | durationHours | durationMinutes | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Applications to review at Test_{RANDOM} |               |                 | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    # Search Created Application List
    When User Searches Application List With:
      | Date  | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | today |      |                  |             |       | OPEN               |                            |                       |           |
    When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
      | Date         | Time  | Location                          | Description                             | Entries | Status |
      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   |
    ## Create Application under Application List
    Then User Clicks On The Link "Create application"
    When User Clicks On The "Show all sections" Button
    Then User Should See The Button "Hide all sections"
    # Applicant Details
    When User Fills In The Applicant Details
      | Select applicant type | Organisation                                |
      | Organisation name     | Test Sample Applicant Organisation {RANDOM} |
      | Address line 1        | {RANDOM} High Street                        |
      | Address line 2        | Apartment {RANDOM}                          |
      | Town or city          | Leeds                                       |
      | County or region      | West Yorkshire                              |
      | Post town             | Leeds                                       |
      | Postcode              | LS10 1PJ                                    |
      | Phone number          | 020 7946 0000                               |
      | Mobile number         | 07123 456789                                |
      | Email address         | john.smith_{RANDOM}test@example.com         |
    # Application Codes
    Then User Enters "CT99002" Into The Textbox "Application code" In The Accordion "Application codes"
    When User Clicks On The "Search" Button In The Accordion "Application codes"
    Then User Verifies Table "Codes" Has Sortable Headers "Code, Title, Bulk, Fee required" In The Accordion "Application codes"
    Then User Clicks "Add code" Button In Row Of Table "Codes" In The Accordion "Application codes"
      | Code    | Title                                          | Bulk | Fee required |
      | CT99002 | Issue of liability order summons - council tax | No   | Yes          |
    Then User Verifies The "Application Title" Textbox Has Value "Issue of liability order summons - council tax"
    # Wording Details
    Then User Verifies The "Wording" Accordion Has Value "Attends to swear a complaint for the issue of a summons for the debtor to answer an application for a liability order in relation to unpaid council tax (reference"
    Then User Verifies The "Wording" Accordion Has textbox with placeholder "Enter a Reference" and Enters "TestRef-001"
    # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
    When User Clicks On The "Apply wording" Button In The Accordion "Wording"
    Then User Sees Success Alert "Wording applied to this entry. Save the entry to keep these changes."
    # Then User Should See The Link "Dismiss"
    # Respondent Details
    When User Fills In The Respondent Details
      | Select type       | Organisation                              |
      | Organisation name | Test Sample Res Organisation {RANDOM}     |
      | Address line 1    | {RANDOM} Low Street                       |
      | Address line 2    | Apartment {RANDOM}                        |
      | Town or city      | Leeds                                     |
      | County or region  | East Yorkshire                            |
      | Post town         | Leeds                                     |
      | Postcode          | LS10 1PJ                                  |
      | Phone number      | 020 7946 0000                             |
      | Mobile number     | 07123 456789                              |
      | Email address     | Respondent.smith_{RANDOM}test@example.com |
    # Civil Fee Details
    Then User Should See The Text "No fee required" In The Accordion "Civil fee"
    Then User Verifies Dropdown "Fee status" Is Disabled In The Accordion "Civil fee"
    Then User Verifies Date Field "Status date" Is Disabled In The Accordion "Civil fee"
    Then User Verifies The Textbox "Payment reference" Is Disabled In The Accordion "Civil fee"
    Then User Verifies The Button "Add fee details" Is Disabled In The Accordion "Civil fee"
    # Notes Details
    Then User Enters "case{RANDOM}" Into The Textbox "Case reference" In The Accordion "Notes"
    Then User Enters "account{RANDOM}" Into The Textbox "Account reference" In The Accordion "Notes"
    Then User Enters "This is a test application with special requirements" Into The Textbox "Application details" In The Accordion "Notes"
    # Submit Application
    When User Clicks On The "Create entry" Button
    Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."

    # ---------------OPEN APPLICATION LIST ENTRY---------------@ARCPOC-635 SC2

    Then User Clicks On The Breadcrumb Link "Applications list details"
    When User Clicks "Open" Button In Row Of Table "Entries" With:
      | Sequence number | Account number  | Applicant                                   | Respondent                            | Postcode | Title                                          | Fee | Resulted |
      | 1               | account{RANDOM} | Test Sample Applicant Organisation {RANDOM} | Test Sample Res Organisation {RANDOM} | LS10 1PJ | Issue of liability order summons - council tax | No  |          |
    When User Clicks On The "Show all sections" Button
    Then User Should See The Button "Hide all sections"
    Then User Sees Page Heading "Applications list entry update"
    Then User See "Summary of application list entry" On The Page
    # Verify Applicant Details
    When User Verifies In The Applicant Details
      | Select applicant type | Organisation                                |
      | Organisation name     | Test Sample Applicant Organisation {RANDOM} |
      | Address line 1        | {RANDOM} High Street                        |
      | Address line 2        | Apartment {RANDOM}                          |
      | Town or city          | Leeds                                       |
      | County or region      | West Yorkshire                              |
      | Post town             | Leeds                                       |
      | Postcode              | LS10 1PJ                                    |
      | Phone number          | 020 7946 0000                               |
      | Mobile number         | 07123 456789                                |
      | Email address         | john.smith_{RANDOM}test@example.com         |
    # Verify Application Codes Details
    Then User Verifies The Textbox "Application code" Contains "CT99002" In The Accordion "Application codes"
    Then User Verifies The Textbox "Application title" Contains "Issue of liability order summons - council tax" In The Accordion "Application codes"
    Then User Verifies The Date field "Lodgement date" Has Value "today"
    Then User Verifies Date Field "Lodgement date" Is Disabled In The Accordion "Application codes"
    # Verify Wording Details
    Then User Verifies The "Wording" Accordion Has Value "Attends to swear a complaint for the issue of a summons for the debtor to answer an application for a liability order in relation to unpaid council tax (reference"
    Then User Verifies The Textbox "" Contains "TestRef-001" In The Accordion "Wording"
    # Verify Respondent Details
    When User Verifies In The Respondent Details
      | Select type       | Organisation                              |
      | Organisation name | Test Sample Res Organisation {RANDOM}     |
      | Address line 1    | {RANDOM} Low Street                       |
      | Address line 2    | Apartment {RANDOM}                        |
      | Town or city      | Leeds                                     |
      | County or region  | East Yorkshire                            |
      | Post town         | Leeds                                     |
      | Postcode          | LS10 1PJ                                  |
      | Phone number      | 020 7946 0000                             |
      | Mobile number     | 07123 456789                              |
      | Email address     | Respondent.smith_{RANDOM}test@example.com |
    # Verify Civil Fee Details
    Then User Should See The Text "No fee required" In The Accordion "Civil fee"
    Then User Verifies Dropdown "Fee status" Is Disabled In The Accordion "Civil fee"
    Then User Verifies Date Field "Status date" Is Disabled In The Accordion "Civil fee"
    Then User Verifies The Textbox "Payment reference" Is Disabled In The Accordion "Civil fee"
    Then User Verifies The Button "Add fee details" Is Disabled In The Accordion "Civil fee"
    # Verify Notes Details
    Then User Verifies The Textbox "Case reference" Contains "case{RANDOM}" In The Accordion "Notes"
    Then User Verifies The Textbox "Account reference" Contains "account{RANDOM}" In The Accordion "Notes"
    Then User Verifies The Textbox "Application details" Contains "This is a test application with special requirements" In The Accordion "Notes"
    # Result Wording Details
    Then User Should See Row In Table "You are resulting the following application(s)" In The Accordion "Result wording" With Values:
      | Applicant(s)                                | Respondent(s)                         | Application title(s)                           |
      | Test Sample Applicant Organisation {RANDOM} | Test Sample Res Organisation {RANDOM} | Issue of liability order summons - council tax |
    Then User Verifies The Button "Apply result" Is Disabled In The Accordion "Result wording"
    # Officials Details
    Then User Verifies Dropdown "Select magistrate's title" Is Visible Under "Magistrate 1" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's first name" Under "Magistrate 1" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's surname" Under "Magistrate 1" FieldSet In The Accordion "Officials"

    Then User Verifies Dropdown "Select magistrate's title" Is Visible Under "Magistrate 2" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's first name" Under "Magistrate 2" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's surname" Under "Magistrate 2" FieldSet In The Accordion "Officials"

    Then User Verifies Dropdown "Select magistrate's title" Is Visible Under "Magistrate 3" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's first name" Under "Magistrate 3" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's surname" Under "Magistrate 3" FieldSet In The Accordion "Officials"

    Then User Verifies Dropdown "Select court official's title" Is Visible Under "Officials" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Official's first name" Under "Officials" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Official's surname" Under "Officials" FieldSet In The Accordion "Officials"

  @applicationListEntry @regression @ARCPOC-222 @ARCPOC-427 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @SC3
  Scenario Outline: Create an ALE where Applicant = Standard Applicant, using an Application Code with Fee Required = Y and Respondent Required = N
    Given User Authenticates Via API As "user1"
    # Create Application List
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                             | durationHours | durationMinutes | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Applications to review at Test_{RANDOM} |               |                 | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    # Search Created Application List
    When User Searches Application List With:
      | Date  | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | today |      |                  |             |       | OPEN               |                            |                       |           |
    When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
      | Date         | Time  | Location                          | Description                             | Entries | Status |
      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   |
    ## Create Application under Application List
    Then User Clicks On The Link "Create application"
    When User Clicks On The "Show all sections" Button
    Then User Should See The Button "Hide all sections"
    # Applicant Details - Standard Applicant Bug-ARCPOC-1342
    Then User Selects "Standard Applicant" In The "Select applicant type" Dropdown
    Then User Enters "APP025" Into The Textbox "Code" In The Accordion "Applicant"
    When User Clicks On The "Search" Button
    When User Checks The Checkbox In Row Of Table "Standard applicants" In The Accordion "Applicant" With:
      | Code   | Name        | Address        | Use from   | Use to |
      | APP025 | Ava Johnson | 258 Cedar Lane | 6 Nov 2025 | —      |
    Then User Should See The Text "Currently selected APP025 Ava Johnson" In The Accordion "Applicant"
    # Application Codes
    Then User Enters "AP99004" Into The Textbox "Application code" In The Accordion "Application codes"
    When User Clicks On The "Search" Button In The Accordion "Application codes"
    Then User Verifies Table "Codes" Has Sortable Headers "Code, Title, Bulk, Fee required" In The Accordion "Application codes"
    Then User Clicks "Add code" Button In Row Of Table "Codes" In The Accordion "Application codes"
      | Code    | Title                                                      | Bulk | Fee required |
      | AP99004 | Request for Certificate of Refusal to State a Case (Civil) | No   | Yes          |
    Then User Verifies The "Application Title" Textbox Has Value "Request for Certificate of Refusal to State a Case (Civil)"
    Then User Verifies The Date field "Lodgement date" Has Value "today"
    # Wording Details
    Then User Verifies The "Wording" Accordion Has Value "Request for a certificate of refusal to state a case for the opinion of the High Court in respect of civil proceedings heard on"
    Then User Verifies The "Wording" Accordion Has textbox with placeholder "Enter a Date" and Enters "today"
    # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
    When User Clicks On The "Apply wording" Button In The Accordion "Wording"
    Then User Sees Success Alert "Wording applied to this entry. Save the entry to keep these changes."
    # Respondent Details Not provided as Respondent Required = N for the Application Code
    # Civil Fee Details
    When User Verifies The Checkbox With Label "Off site fee applies" In The Accordion "Civil fee" Is Enabled
    Then User Should See The Text "Selecting this will apply the off site fee to the entry." In The Accordion "Civil fee"
    Then User Should See The Text "Fee Reference: CO3.1" In The Accordion "Civil fee"
    Then User Should See The Text "Amount: £105.00" In The Accordion "Civil fee"
    Then User Verifies The Checkbox With Label " Off site fee applies " In The Accordion "Civil fee" Is Unchecked
    Then User Checks The Checkbox With Label " Off site fee applies " In The Accordion "Civil fee"
    # Bug ARCPOC-1241 is raised
    Then User Should See The Text "Off Site Fee Reference: CO1.1" In The Accordion "Civil fee"
    Then User Should See The Text "Off Site Fee Amount: £30.00" In The Accordion "Civil fee"
    Then User Should See The Text "Total Fee Amount: £135.00" In The Accordion "Civil fee"
    Then User Selects "Paid" From The Dropdown "Fee status" In The Accordion "Civil fee"
    Then User Enters "today" Into The Date Field "Status date" In The Accordion "Civil fee"
    Then User Enters "PAY-12345-{RANDOM}" Into The Textbox "Payment reference" In The Accordion "Civil fee"
    When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
    # Notes Details
    Then User Enters "case{RANDOM}" Into The Textbox "Case reference" In The Accordion "Notes"
    Then User Enters "account{RANDOM}" Into The Textbox "Account reference" In The Accordion "Notes"
    Then User Enters "This is a test application with special requirements" Into The Textbox "Application details" In The Accordion "Notes"
    # Submit Application
    When User Clicks On The "Create entry" Button
    Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."

    # ---------------OPEN APPLICATION LIST ENTRY-----------@ARCPOC-635 SC3

    Then User Clicks On The Breadcrumb Link "Applications list details"
    When User Clicks "Open" Button In Row Of Table "Entries" With:
      | Sequence number | Account number  | Applicant   | Respondent | Postcode | Title                                                      | Fee | Resulted |
      | 1               | account{RANDOM} | Ava Johnson |            |          | Request for Certificate of Refusal to State a Case (Civil) | Yes |          |
    When User Clicks On The "Show all sections" Button
    Then User Should See The Button "Hide all sections"
    Then User Sees Page Heading "Applications list entry update"
    Then User See "Summary of application list entry" On The Page
    # Verify Applicant Details
    When User Verifies In The Applicant Details
      | Select applicant type | Standard Applicant |
    Then User Should See The Text "Saved APP025 Ava Johnson" In The Accordion "Applicant"
    # Then User Verifies The Checkbox is Checked In Row Of Table "Standard applicants" In The Accordion "Applicant" With:
    #   | Code   | Name        | Address        | Use from   | Use to |
    #   | APP025 | Ava Johnson | 258 Cedar Lane | 6 Nov 2025 | —      |
    # Verify Application Codes Details
    Then User Verifies The Textbox "Application code" Contains "AP99004" In The Accordion "Application codes"
    Then User Verifies The Textbox "Application title" Contains "Request for Certificate of Refusal to State a Case (Civil)" In The Accordion "Application codes"
    Then User Verifies The Date field "Lodgement date" Has Value "today"
    Then User Verifies Date Field "Lodgement date" Is Disabled In The Accordion "Application codes"
    # Verify Wording Details
    Then User Verifies The "Wording" Accordion Has Value "Request for a certificate of refusal to state a case for the opinion of the High Court in respect of civil proceedings heard on"
    Then User Verifies The Textbox "" Contains "today" In The Accordion "Wording"
    # Verify Respondent Details Not provided as Respondent Required = N for the Application Code
    # Verify Civil Fee Details
    Then User Verifies The Checkbox With Label "Off site fee applies" In The Accordion "Civil fee" Is Checked
    Then User Should See The Text "Selecting this will automatically apply the off site fee to the entry. This change is saved immediately." In The Accordion "Civil fee"
    Then User Should See The Text "Fee Reference: CO3.1" In The Accordion "Civil fee"
    Then User Should See The Text "Amount: £105.00" In The Accordion "Civil fee"
    Then User Should See The Text "Off Site Fee Reference: CO1.1" In The Accordion "Civil fee"
    Then User Should See The Text "Off Site Fee Amount: £30.00" In The Accordion "Civil fee"
    Then User Should See The Text "Total Fee Amount: £135.00" In The Accordion "Civil fee"
    Then User Verifies "Change" Link Is Visible In Row Of Table In The Accordion "Civil fee" With:
      | Fee Status | Status Date  | Payment Ref        |
      | PAID       | todaydisplay | PAY-12345-{RANDOM} |
    # Verify Notes Details
    Then User Verifies The Textbox "Case reference" Contains "case{RANDOM}" In The Accordion "Notes"
    Then User Verifies The Textbox "Account reference" Contains "account{RANDOM}" In The Accordion "Notes"
    Then User Verifies The Textbox "Application details" Contains "This is a test application with special requirements" In The Accordion "Notes"
    # Result Wording Details
    Then User Should See Row In Table "You are resulting the following application(s)" In The Accordion "Result wording" With Values:
      | Applicant(s) | Respondent(s) | Application title(s)                                       |
      | Ava Johnson  |               | Request for Certificate of Refusal to State a Case (Civil) |
    Then User Verifies The Textbox "Result code" In The Accordion "Result wording" Is Empty
    Then User Verifies The Button "Apply result" Is Disabled In The Accordion "Result wording"
    # Officials Details
    Then User Verifies Dropdown "Select magistrate's title" Is Visible Under "Magistrate 1" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's first name" Under "Magistrate 1" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's surname" Under "Magistrate 1" FieldSet In The Accordion "Officials"

    Then User Verifies Dropdown "Select magistrate's title" Is Visible Under "Magistrate 2" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's first name" Under "Magistrate 2" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's surname" Under "Magistrate 2" FieldSet In The Accordion "Officials"

    Then User Verifies Dropdown "Select magistrate's title" Is Visible Under "Magistrate 3" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's first name" Under "Magistrate 3" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Magistrate's surname" Under "Magistrate 3" FieldSet In The Accordion "Officials"

    Then User Verifies Dropdown "Select court official's title" Is Visible Under "Officials" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Official's first name" Under "Officials" FieldSet In The Accordion "Officials"
    Then User Should See The Textbox "Official's surname" Under "Officials" FieldSet In The Accordion "Officials"

