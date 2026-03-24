Feature: Applications List Entry Create

    @PJ
    Scenario Outline: Create Application List Entry With Complete Details
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time   | List description | CourtSearch   | Court   | Select list status | Other location description | Criminal justice area | CJASearch |
            | <SearchDate> | <Time> | <Description>    | <CourtSearch> | <Court> | <Status>           |                            |                       |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications List" On The Page
        Then User Clicks On The Link "Create application"

        When User Fills In The Applicant Details
            | Select applicant type | Person                 |
            | Select title          | Mr                     |
            | First name            | John                   |
            | Middle name(s)        | Michael                |
            | Surname               | Smith                  |
            | Address line 1        | 123 High Street        |
            | Address line 2        | Apartment 4B           |
            | Town or city          | Leeds                  |
            | County or region      | West Yorkshire         |
            | Post town             | Leeds                  |
            | Postcode              | LS1 1AA                |
            | Phone number          | 020 7946 0000          |
            | Mobile number         | 07123 456789           |
            | Email address         | john.smith@example.com |

        When User Fills In The Respondent Details
            | Select type      | Person               |
            | Select title     | Mrs                  |
            | First name       | Jane                 |
            | Middle name(s)   | Elizabeth            |
            | Surname          | Doe                  |
            | Address line 1   | 456 Park Road        |
            | Address line 2   | Building C           |
            | Town or city     | Manchester           |
            | County or region | Greater Manchester   |
            | Post town        | Manchester           |
            | Postcode         | M1 1AA               |
            | Phone number     | 020 7946 1111        |
            | Mobile number    | 07987 654321         |
            | Email address    | jane.doe@example.com |

        Then User Enters "APP-2026-001" Into The Accordion "Codes" Textbox "Application code"
        Then User Enters "Test Application" Into The Accordion "Codes" Textbox "Application title"
        Then User Enters "20/03/2026" Into The Accordion "Codes" Date Field "Lodgement date"

        Then User Enters "Test wording content" Into The Accordion "Wording" Textbox "Wording"

        Then User Selects "Paid" From The Accordion "Civil fee" Dropdown "Fee status"
        Then User Enters "15/05/2025" Into The Accordion "Civil fee" Date Field "Status date"
        Then User Enters "PAY-2025-12345" Into The Accordion "Civil fee" Textbox "Payment reference"
        When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"

        Then User Enters "CR-2025-00123" Into The Accordion "Notes" Textbox "Case reference"
        Then User Enters "AC-987654" Into The Accordion "Notes" Textbox "Account reference"
        Then User Enters "This is a test application with special requirements" Into The Accordion "Notes" Textbox "Application details"

        Examples:
            | User  | SearchDate | DisplayDate | Time  | CourtSearch | Court                             | Description                         | Entries | Status |
            | user1 | 20/03/2026 | 20 Mar 2026 | 10:20 | LCCC065     | Leeds Combined Court Centre Set 7 | Applications to review at Test_2614 | 0       | OPEN   |

    @PJ
    Scenario Outline: test
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time   | List description | CourtSearch   | Court   | Select list status | Other location description | Criminal justice area | CJASearch |
            | <SearchDate> | <Time> | <Description>    | <CourtSearch> | <Court> | <Status>           |                            |                       |           |
        When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User See "Applications List" On The Page
        Then User Clicks On The Link "Create application"
        Then User Selects "Person" From The Accordion "Applicant" Dropdown "Select applicant type"
        Then User Selects "Dr" From The Accordion "Applicant" Dropdown "Select title"
        Then User Enters "Appl" Into The Accordion "Applicant" Textbox "First name"

        Then User Enters "Resp" Into The Accordion "Respondent" Textbox "First name"
        Then User Selects "Person" From The Accordion "Respondent" Dropdown "Select type"

        Then User Enters "20/03/2026" Into The Accordion "Civil fee" Date Field "Status date"


        Examples:
            | User  | TableName | SearchDate | DisplayDate | Time  | CourtSearch | Court                             | Description                         | Entries | Status |
            | user1 | Lists     | 20/03/2026 | 20 Mar 2026 | 10:20 | LCCC065     | Leeds Combined Court Centre Set 7 | Applications to review at Test_2614 | 0       | OPEN   |

    @ignore @ARCPOC-222 @ARCPOC-427 @ARCPOC-1238 @ARCPOC-1239
    Scenario Outline: Create an ALE where Applicant = Person and Respondent = Person, using an Application Code with Fee Required = Y and Respondent Required = Y
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
            | Select applicant type | Person                 |
            | Select title          | Mr                     |
            | First name            | John                   |
            | Middle name(s)        | Michael                |
            | Surname               | Smith                  |
            | Address line 1        | 123 High Street        |
            | Address line 2        | Apartment 4B           |
            | Town or city          | Leeds                  |
            | County or region      | West Yorkshire         |
            | Post town             | Leeds                  |
            | Postcode              | LS10 1PJ               |
            | Phone number          | 020 7946 0000          |
            | Mobile number         | 07123 456789           |
            | Email address         | john.smith@example.com |
        # Application Codes
        Then User Enters "<ApplicationCode>" Into The Accordion "Codes" Textbox "Application code"
        When User Clicks On The "Search" Button In The Accordion "Codes"
        Then User Verifies Table "Codes" In The Accordion "Codes" Has Sortable Headers "Code, Title, Bulk, Fee req"
        Then User Clicks "Add code" Button In Row Of Table "Codes" With In The Accordion "Codes":
            | Code              | Title              | Bulk | Fee req |
            | <ApplicationCode> | <ApplicationTitle> | No   | CO8.1   |
        Then User Verifies The "Application Title" Textbox Has Value "<ApplicationTitle>"
        Then User Verifies The Date field "Lodgement date" Has Value "<SearchDate>"
        # Wording Details
        Then User Verifies The "Wording" Accordion Has Value "<WordingText>"
        Then User Verifies The "Wording" Accordion Has textbox with placeholder "<placeholder>" and Enters "<WordingValue>"
        # (Bug raised ARCPOC-1230/ARCPOC-1205 for below statement)
        When User Clicks On The "Save Wording" Button In The Accordion "Wording"
        # Respondent Details
        When User Fills In The Respondent Details
            | Select type      | Person               |
            | Select title     | Mrs                  |
            | First name       | Jane                 |
            | Middle name(s)   | Elizabeth            |
            | Surname          | Doe                  |
            | Address line 1   | 456 Park Road        |
            | Address line 2   | Building C           |
            | Town or city     | Leeds                |
            | County or region | West Yorkshire       |
            | Post town        | Leeds                |
            | Postcode         | LS10 1PJ             |
            | Phone number     | 020 7946 1111        |
            | Mobile number    | 07987 654321         |
            | Email address    | jane.doe@example.com |
        # Civil Fee Details
        Then User Selects "Paid" From The Accordion "Civil fee" Dropdown "Fee status"
        Then User Enters "<SearchDate>" Into The Accordion "Civil fee" Date Field "Status date"
        Then User Enters "<PaymentReference>" Into The Accordion "Civil fee" Textbox "Payment reference"
        When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
        # Notes Details
        Then User Enters "<CaseReference>" Into The Accordion "Notes" Textbox "Case reference"
        Then User Enters "<AccountReference>" Into The Accordion "Notes" Textbox "Account reference"
        Then User Enters "This is a test application with special requirements" Into The Accordion "Notes" Textbox "Application details"
        # Submit Application
        When User Clicks On The "Create entry" Button
        Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."

        Examples:
            | User  | TableName | SearchDate | DisplayDate  | Time  | Court                             | Description                             | Entries | Status | SelectButtonText | ButtonName | ApplicationCode | ApplicationTitle           | WordingText                                      | placeholder                  | WordingValue        | PaymentReference | CaseReference | AccountReference |
            | user1 | Lists     | today      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   | Select           | Open       | MX99006         | Condemnation of Unfit Food | Application for the condemnation of food, namely | Enter a Describe Seized Food | Test Sample Wording | PAY-12345        | case12345     | account12345     |



