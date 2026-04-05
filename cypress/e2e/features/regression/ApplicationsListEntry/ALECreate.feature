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

        When User Fills In The Respondent Details
            | Select type      | Organisation                 |
            | name             | Test Sample Res Organisation |
            | Address line 1   | 123 High Street              |
            | Address line 2   | Apartment 4B                 |
            | Town or city     | Leeds                        |
            | County or region | West Yorkshire               |
            | Post town        | Leeds                        |
            | Postcode         | LS10 1PJ                     |
            | Phone number     | 020 7946 0000                |
            | Mobile number    | 07123 456789                 |
            | Email address    | john.smith@example.com       |

        Then User Enters "MX99009" Into The Accordion "Codes" Textbox "Application code"
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

    @PJ1
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

    @ignore @ARCPOC-222 @ARCPOC-427 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @SC1
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
        # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
        When User Clicks On The "Save Wording" Button In The Accordion "Wording"
        Then User Sees Success Alert "Successfully saved wording"
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
            | User  | TableName | SearchDate | DisplayDate  | Time  | Court                             | Description                             | Entries | Status | SelectButtonText | ButtonName | ApplicationCode | ApplicationTitle           | WordingText                                      | placeholder                  | WordingValue        | PaymentReference | CaseReference | AccountReference | OffsiteFeeString                                                                                         | OffsiteFeeCode | OffsiteFeeValue             | TotalFeeAmount            | FeeReference         | FeeAmount       |
            | user1 | Lists     | today      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   | Select           | Open       | MX99006         | Condemnation of Unfit Food | Application for the condemnation of food, namely | Enter a Describe Seized Food | Test Sample Wording | PAY-12345        | case12345     | account12345     | Selecting this will automatically apply the off site fee to the entry. This change is saved immediately. | CO1.1          | Off Site Fee Amount: £30.00 | Total Fee Amount: £284.00 | Fee Reference: CO8.1 | Amount: £284.00 |

    @ignore @ARCPOC-222 @ARCPOC-427 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @SC2
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
        # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
        When User Clicks On The "Save Wording" Button In The Accordion "Wording"
        Then User Sees Success Alert "Successfully saved wording"
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
        Then User Enters "<CaseReference>" Into The Accordion "Notes" Textbox "Case reference"
        Then User Enters "<AccountReference>" Into The Accordion "Notes" Textbox "Account reference"
        Then User Enters "This is a test application with special requirements" Into The Accordion "Notes" Textbox "Application details"
        # Submit Application
        When User Clicks On The "Create entry" Button
        Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."

        Examples:
            | User  | SearchDate | DisplayDate  | Time  | Court                             | Description                             | Entries | Status | SelectButtonText | ButtonName | ApplicationCode | ApplicationTitle                               | WordingText                                                                                                                                                        | placeholder       | WordingValue | TableName | CaseReference | AccountReference |
            | user1 | today      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   | Select           | Open       | CT99002         | Issue of liability order summons - council tax | Attends to swear a complaint for the issue of a summons for the debtor to answer an application for a liability order in relation to unpaid council tax (reference | Enter a Reference | TestRef-001  | Lists     | case12345     | account12345     |

    @ignore @ARCPOC-222 @ARCPOC-427 @ARCPOC-1238 @ARCPOC-1239 @ARCPOC-1241 @SC3
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
        When User Fills In The Applicant Details
            | Select applicant type | Standard Applicant |
        When User Checks The Checkbox In Row Of Table In The Accordion "Applicant" With:
            | Code         | Name         | Address         | Use from     | Use to |
            | <StdAppCode> | <StdAppName> | <StdAppAddress> | <StdAppFrom> | —      |
        # Application Codes
        Then User Enters "<ApplicationCode>" Into The Accordion "Codes" Textbox "Application code"
        When User Clicks On The "Search" Button In The Accordion "Codes"
        Then User Verifies Table "Codes" In The Accordion "Codes" Has Sortable Headers "Code, Title, Bulk, Fee req"
        Then User Clicks "Add code" Button In Row Of Table "Codes" With In The Accordion "Codes":
            | Code              | Title              | Bulk | Fee req |
            | <ApplicationCode> | <ApplicationTitle> | No   | CO3.1   |
        Then User Verifies The "Application Title" Textbox Has Value "<ApplicationTitle>"
        Then User Verifies The Date field "Lodgement date" Has Value "<SearchDate>"
        # Wording Details
        Then User Verifies The "Wording" Accordion Has Value "<WordingText>"
        Then User Verifies The "Wording" Accordion Has textbox with placeholder "<placeholder>" and Enters "<WordingValue>"
        # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
        When User Clicks On The "Save Wording" Button In The Accordion "Wording"
        Then User Sees Success Alert "Successfully saved wording"
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
            | User  | TableName | SearchDate | DisplayDate  | Time  | Court                             | Description                             | Entries | Status | SelectButtonText | ButtonName | ApplicationCode | ApplicationTitle                                           | WordingText                                                                                                                     | placeholder  | WordingValue | PaymentReference | CaseReference | AccountReference | OffsiteFeeString                                         | OffsiteFeeCode | OffsiteFeeValue             | TotalFeeAmount            | FeeReference         | FeeAmount       | StdAppCode | StdAppName       | StdAppAddress  | StdAppFrom |
            | user1 | Lists     | today      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   | Select           | Open       | AP99004         | Request for Certificate of Refusal to State a Case (Civil) | Request for a certificate of refusal to state a case for the opinion of the High Court in respect of civil proceedings heard on | Enter a Date | today        | PAY-12345        | case12345     | account12345     | Selecting this will apply the off site fee to the entry. | CO1.1          | Off Site Fee Amount: £30.00 | Total Fee Amount: £135.00 | Fee Reference: CO3.1 | Amount: £105.00 | APP025     | Miss Ava Johnson | 258 Cedar Lane | 06/11/2025 |

    #  Regex Validations
    @ignore @ARCPOC-222 @ARCPOC-1107 @ARCPOC-1282 @ARCPOC-1209 @SC1
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
            | Select applicant type | Person |
            | Select title          | Mr     |
            | First name            |        |
            | Middle name(s)        |        |
            | Surname               |        |
            | Address line 1        |        |
            | Address line 2        |        |
            | Town or city          |        |
            | County or region      |        |
            | Post town             |        |
            | Postcode              |        |
            | Phone number          |        |
            | Mobile number         |        |
            | Email address         |        |
        When User Clicks On The "Create entry" Button
        Then User Sees Validation Error Banner "There is a problem Enter an application code Enter a first name Enter a last name Enter address line 1"
        When User Fills In The Applicant Details
            | Select applicant type | Person                                                                                   |
            | Select title          | Mr                                                                                       |
            | First name            | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Middle name(s)        | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Surname               | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Address line 1        | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Address line 2        | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Town or city          | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | County or region      | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Post town             | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Postcode              | CIKMOV 1AA                                                                               |
            | Phone number          | 12345678901234567890                                                                     |
            | Mobile number         | 12345678901234567890                                                                     |
            | Email address         | invalid-email-address-format@.com                                                        |
        When User Clicks On The "Create entry" Button
        # @Bug ARCPOC-1269 is raised for the below statement as validation error message is not displayed
        Then User Sees Validation Error Banner "There is a problem Enter an application code First name must be less than or equal to 60 characters Middle names must be less than or equal to 60 characters Last name must be less than or equal to 60 characters Address line 1 must be less than or equal to 60 characters Address line 2 must be less than or equal to 60 characters Town or city must be less than or equal to 60 characters County or region must be less than or equal to 60 characters Post town must be less than or equal to 60 characters Enter a valid UK postcode Enter a valid UK telephone number Enter a valid UK mobile number Enter an email address in the correct format"
        When User Fills In The Applicant Details
            | Select applicant type | Person                                                      |
            | Select title          | Mr                                                          |
            | First name            | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Middle name(s)        | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Surname               | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Address line 1        | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Address line 2        | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Town or city          | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | County or region      | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Post town             | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Postcode              | SW1A 2AA                                                    |
            | Phone number          | 020 7946 0000                                               |
            | Mobile number         | 07123 456789                                                |
            | Email address         | test@example.com                                            |
        # Application Codes
        Then User Enters "<InvalidApplicationCodeExceedsLimit>" Into The Accordion "Codes" Textbox "Application code"
        When User Clicks On The "Search" Button In The Accordion "Codes"
        Then User Sees Error Alert "There is a problem We couldn’t fetch application codes. Please try again."
        Then User Enters "<InvalidApplicationCode>" Into The Accordion "Codes" Textbox "Application code"
        When User Clicks On The "Search" Button In The Accordion "Codes"
        Then User Sees Information Alert "No application codes found Try different filters, or retry the search."
        Then User Enters "<ValidApplicationCode>" Into The Accordion "Codes" Textbox "Application code"
        When User Clicks On The "Search" Button In The Accordion "Codes"
        Then User Verifies Table "Codes" In The Accordion "Codes" Has Sortable Headers "Code, Title, Bulk, Fee req"
        Then User Clicks "Add code" Button In Row Of Table "Codes" With In The Accordion "Codes":
            | Code              | Title              | Bulk | Fee req |
            | <ApplicationCode> | <ApplicationTitle> | No   | CO8.1   |
        Then User Verifies The "Application Title" Textbox Has Value "<ApplicationTitle>"
        Then User Verifies The Date field "Lodgement date" Has Value "<SearchDate>"
        # Wording Details
        Then User Verifies The "Wording" Accordion Has Value "<WordingText>"
        When User Clicks On The "Save Wording" Button In The Accordion "Wording"
        Then User Sees Validation Error Banner "There is a problem Enter a Describe Seized Food in the wording section"
        Then User Verifies The "Wording" Accordion Has textbox with placeholder "<placeholder>" and Enters "<WordingValueExceedsLimit>"
        # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
        When User Clicks On The "Save Wording" Button In The Accordion "Wording"
        Then User Sees Validation Error Banner "There is a problem Describe Seized Food in the wording section must be 100 characters or fewer"
        Then User Verifies The "Wording" Accordion Has textbox with placeholder "<placeholder>" and Enters "<WordingValue>"
        When User Clicks On The "Save Wording" Button In The Accordion "Wording"
        Then User Sees Success Alert "Successfully saved wording"
        # Respondent Details Validations
        When User Fills In The Respondent Details
            | Select type      | Person |
            | Select title     | Mr     |
            | First name       |        |
            | Middle name(s)   |        |
            | Surname          |        |
            | Address line 1   |        |
            | Address line 2   |        |
            | Town or city     |        |
            | County or region |        |
            | Post town        |        |
            | Postcode         |        |
            | Phone number     |        |
            | Mobile number    |        |
            | Email address    |        |
        When User Clicks On The "Create entry" Button
        Then User Sees Validation Error Banner "There is a problem Select a fee status Enter a status date Enter a first name Enter a last name Enter address line 1"
        When User Fills In The Respondent Details
            | Select type      | Person                                                                                   |
            | Select title     | Mr                                                                                       |
            | First name       | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Middle name(s)   | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Surname          | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Address line 1   | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Address line 2   | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Town or city     | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | County or region | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Post town        | yeli edtj.e ic-vsñcespietagccberac( )rN(ee asaa )oayadrrti)e- abcdefghijklmnopqrstuvwxyz |
            | Postcode         | CIKMOV 1AA                                                                               |
            | Phone number     | 12345678901234567890                                                                     |
            | Mobile number    | 12345678901234567890                                                                     |
            | Email address    | invalid-email-address-format@.com                                                        |
        When User Clicks On The "Create entry" Button
        Then User Sees Validation Error Banner "There is a problem Select a fee status Enter a status date First name must be less than or equal to 60 characters Middle names must be less than or equal to 60 characters Last name must be less than or equal to 60 characters Address line 1 must be less than or equal to 60 characters Address line 2 must be less than or equal to 60 characters Town or city must be less than or equal to 60 characters County or region must be less than or equal to 60 characters Post town must be less than or equal to 60 characters Enter a valid UK postcode Enter a valid UK telephone number Enter a valid UK mobile number Enter an email address in the correct format"
        When User Fills In The Respondent Details
            | Select type      | Person                                                      |
            | Select title     | Mr                                                          |
            | First name       | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Middle name(s)   | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Surname          | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Address line 1   | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Address line 2   | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Town or city     | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | County or region | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Post town        | rrgi .)ec(rnab()ant e,huscruS-iñacñ ,.Eüeüc'h maeüsa)ncnc,r |
            | Postcode         | SW1A 2AA                                                    |
            | Phone number     | 020 7946 0000                                               |
            | Mobile number    | 07123 456789                                                |
            | Email address    | 1Bx0a@example.com                                           |
        When User Clicks On The "Create entry" Button
        # Civil Fee Validation
        Then User Sees Validation Error Banner "There is a problem Select a fee status Enter a status date"
        Then User Selects "Due" From The Accordion "Civil fee" Dropdown "Fee status"
        Then User Enters "<InvalidSearchDate>" Into The Accordion "Civil fee" Date Field "Status date"
        Then User Enters "<PaymentReferenceExceedsLimit>" Into The Accordion "Civil fee" Textbox "Payment reference"
        When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
        Then User Sees Validation Error Banner "There is a problem Enter a status date A payment reference cannot be supplied when fee status is DUE Payment reference must be less than or equal to 15 characters"
        Then User Selects "Paid" From The Accordion "Civil fee" Dropdown "Fee status"
        Then User Enters "<SearchDateFuture>" Into The Accordion "Civil fee" Date Field "Status date"
        Then User Enters "<PaymentReference>" Into The Accordion "Civil fee" Textbox "Payment reference"
        When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
        Then User Sees Validation Error Banner "There is a problem Enter a status date"
        Then User Enters "<SearchDate>" Into The Accordion "Civil fee" Date Field "Status date"
        When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
        Then User Sees Success Alert "Successfully added fee details"
        # Notes Validation
        Then User Enters "<CaseReferenceExceedsLimit>" Into The Accordion "Notes" Textbox "Case reference"
        Then User Enters "<AccountReferenceExceedsLimit>" Into The Accordion "Notes" Textbox "Account reference"
        Then User Enters "<AccountDetails>" Into The Accordion "Notes" Textbox "Application details"
        When User Clicks On The "Create entry" Button
        Then User Sees Validation Error Banner "There is a problem Enter a status date Case reference must be less than or equal to 15 characters Account reference must be less than or equal to 20 characters"
        Then User Enters "<CaseReference>" Into The Accordion "Notes" Textbox "Case reference"
        Then User Enters "<AccountReference>" Into The Accordion "Notes" Textbox "Account reference"
        When User Clicks On The "Create entry" Button
        Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."

        Examples:
        Then User Enters "<InvalidApplicationCodeExceedsLimit>" Into The Accordion "Codes" Textbox "Application code"
            | User  | TableName | InvalidSearchDate | SearchDate | SearchDateFuture | DisplayDate  | Time  | Court                             | Description                             | Entries | Status | SelectButtonText | ButtonName | InvalidApplicationCodeExceedsLimit | InvalidApplicationCode | ValidApplicationCode | ApplicationTitle           | WordingText                                      | placeholder                  | WordingValue        | WordingValueExceedsLimit                                                                              | WordingValue                          | PaymentReferenceExceedsLimit | PaymentReference | CaseReferenceExceedsLimit | CaseReference | AccountReferenceExceedsLimit | AccountReference | OffsiteFeeString                                                                                         | OffsiteFeeCode | OffsiteFeeValue             | TotalFeeAmount            | FeeReference         | FeeAmount       | AccountDetails                                       |
            | user1 | Lists     | 31/13/2048        | today      | tomorrow         | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   | Select           | Open       | INVALID_CODE                       | CT99002A               | MX99006              | Condemnation of Unfit Food | Application for the condemnation of food, namely | Enter a Describe Seized Food | Test Sample Wording | (ctgn sürrreartcée.sstegl( lmamaeceegScerttpaN( )e -))t,eanoce)erc e(v.etth. abthubienr sa,to,)rtqwer | Test Sample Wording Not Exceeds Limit | PAY-12345-12345-12345        | PAY-12345        | case123451234512345       | case12345     | account12345123451234512345  | account12345     | Selecting this will automatically apply the off site fee to the entry. This change is saved immediately. | CO1.1          | Off Site Fee Amount: £30.00 | Total Fee Amount: £284.00 | Fee Reference: CO8.1 | Amount: £284.00 | This is a test application with special requirements |

    @ignore @ARCPOC-222 @ARCPOC-1107 @SC2
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
        # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
        When User Clicks On The "Save Wording" Button In The Accordion "Wording"
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
        Then User Enters "<CaseReference>" Into The Accordion "Notes" Textbox "Case reference"
        Then User Enters "<AccountReference>" Into The Accordion "Notes" Textbox "Account reference"
        Then User Enters "This is a test application with special requirements" Into The Accordion "Notes" Textbox "Application details"
        # Submit Application
        When User Clicks On The "Create entry" Button
        Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."

        Examples: