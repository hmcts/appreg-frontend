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
