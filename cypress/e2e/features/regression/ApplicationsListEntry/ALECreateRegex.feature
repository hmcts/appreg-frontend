Feature: Applications List Entry Create

    #  Regex Validations
    @ARCPOC-222 @ARCPOC-1107 @ARCPOC-1282 @ARCPOC-1209 @ARCPOC-1241 @ARCPOC-1238 @ARCPOC-1302 @ARCPOC-1319  @SC1
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
            | Select applicant type | Person                                                                                                |
            | Select title          | Mr                                                                                                    |
            | First name            | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zda |
            | Middle name(s)        | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zds |
            | Surname               | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zdw |
            | Address line 1        | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v3                                                                  |
            | Address line 2        | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v3                                                                  |
            | Town or city          | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v3                                                                  |
            | County or region      | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v3                                                                  |
            | Post town             | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v3                                                                  |
            | Postcode              | CIKMOV 1AA                                                                                            |
            | Phone number          | 12345678901234567890                                                                                  |
            | Mobile number         | 12345678901234567890                                                                                  |
            | Email address         | invalid-email-address-format@.com                                                                     |
        When User Clicks On The "Create entry" Button
        # @Bug ARCPOC-1269 is raised for the below statement as validation error message is not displayed
        Then User Sees Validation Error Banner "There is a problem Enter an application code First name must be 100 characters or fewer Middle names must be 100 characters or fewer Last name must be 100 characters or fewer Address line 1 must be 35 characters or fewer Address line 2 must be 35 characters or fewer Town or city must be 35 characters or fewer County or region must be 35 characters or fewer Post town must be 35 characters or fewer Enter a valid UK postcode Enter a valid UK telephone number Enter a valid UK mobile number Enter an email address in the correct format"
        When User Fills In The Applicant Details
            | Select applicant type | Person                                                                                               |
            | Select title          | Mr                                                                                                   |
            | First name            | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zd |
            | Middle name(s)        | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zd |
            | Surname               | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zd |
            | Address line 1        | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Address line 2        | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Town or city          | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | County or region      | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Post town             | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Postcode              | SW1A 2AA                                                                                             |
            | Phone number          | 020 7946 0000                                                                                        |
            | Mobile number         | 07123 456789                                                                                         |
            | Email address         | test@example.com                                                                                     |
        # Application Codes
        Then User Enters "<InvalidApplicationCodeExceedsLimit>" Into The Textbox "Application code" In The Accordion "Application Codes"
        When User Clicks On The "Search" Button In The Accordion "Application Codes"
        Then User Sees Error Alert "There is a problem We couldn’t fetch application codes. Please try again."
        Then User Enters "<InvalidApplicationCode>" Into The Textbox "Application code" In The Accordion "Application Codes"
        When User Clicks On The "Search" Button In The Accordion "Application Codes"
        Then User Sees Information Alert "No application codes found Try different filters, or retry the search."
        Then User Enters "<ValidApplicationCode>" Into The Textbox "Application code" In The Accordion "Application Codes"
        When User Clicks On The "Search" Button In The Accordion "Application Codes"
        Then User Verifies Table "Codes" Has Sortable Headers "Code, Title, Bulk, Fee required" In The Accordion "Application Codes"
        Then User Clicks "Add code" Button In Row Of Table "Codes" In The Accordion "Application Codes"
            | Code                   | Title              | Bulk | Fee required |
            | <ValidApplicationCode> | <ApplicationTitle> | No   | CO8.1        |
        Then User Verifies The "Application Title" Textbox Has Value "<ApplicationTitle>"
        Then User Verifies The Date field "Lodgement date" Has Value "<SearchDate>"
        # Wording Details
        Then User Verifies The "Wording" Accordion Has Value "<WordingText>"
        When User Clicks On The "Apply wording" Button In The Accordion "Wording"
        Then User Sees Validation Error Banner "There is a problem Enter a Describe Seized Food in the wording section"
        Then User Verifies The "Wording" Accordion Has textbox with placeholder "<placeholder>" and Enters "<WordingValueExceedsLimit>"
        # (Bug raised ARCPOC-1230/ARCPOC-1205/AARCPOC-1253 for below statement)
        When User Clicks On The "Apply wording" Button In The Accordion "Wording"
        Then User Sees Validation Error Banner "There is a problem Describe Seized Food in the wording section must be 100 characters or fewer"
        Then User Verifies The "Wording" Accordion Has textbox with placeholder "<placeholder>" and Enters "<WordingValue>"
        When User Clicks On The "Apply wording" Button In The Accordion "Wording"
        Then User Sees Success Alert "Wording applied to this entry. Save the entry to keep these changes."
        # Respondent Details Validations
        When User Fills In The Respondent Details
            | Select type      | Person |
            | Select title     | Mr     |
            | First name       |        |
            | Middle name(s)   |        |
            | Surname          |        |
            | Date of birth    |        |
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
        Then User Sees Validation Error Banner "There is a problem Select a fee status Enter a valid status date Enter a first name Enter a last name Enter address line 1"
        When User Fills In The Respondent Details
            | Select type      | Person                                                                                                |
            | Select title     | Mr                                                                                                    |
            | First name       | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zda |
            | Middle name(s)   | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zda |
            | Surname          | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zda |
            | Date of birth    | tomorrow                                                                                              |
            | Address line 1   | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v3                                                                  |
            | Address line 2   | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v3                                                                  |
            | Town or city     | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v3                                                                  |
            | County or region | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v3                                                                  |
            | Post town        | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v3                                                                  |
            | Postcode         | CIKMOV 1AA                                                                                            |
            | Phone number     | 12345678901234567890                                                                                  |
            | Mobile number    | 12345678901234567890                                                                                  |
            | Email address    | invalid-email-address-format@.com                                                                     |
        When User Clicks On The "Create entry" Button
        Then User Sees Validation Error Banner "There is a problem Select a fee status Enter a valid status date Date must be in the past First name must be 100 characters or fewer Middle names must be 100 characters or fewer Last name must be 100 characters or fewer Address line 1 must be 35 characters or fewer Address line 2 must be 35 characters or fewer Town or city must be 35 characters or fewer County or region must be 35 characters or fewer Post town must be 35 characters or fewer Enter a valid UK postcode Enter a valid UK telephone number Enter a valid UK mobile number Enter an email address in the correct format"
        # Bug ARCPOC-1302
        When User Fills In The Respondent Details
            | Select type      | Person                                                                                               |
            | Select title     | Mr                                                                                                   |
            | First name       | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zd |
            | Middle name(s)   | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zd |
            | Surname          | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zd |
            | Date of birth    | today                                                                                                |
            | Address line 1   | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Address line 2   | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Town or city     | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | County or region | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Post town        | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Postcode         | SW1A 2AA                                                                                             |
            | Phone number     | 020 7946 0000                                                                                        |
            | Mobile number    | 07123 456789                                                                                         |
            | Email address    | 1Bx0a@example.com                                                                                    |
        When User Clicks On The "Create entry" Button
        Then User Sees Validation Error Banner "There is a problem Select a fee status Enter a valid status date Date must be in the past"
        When User Fills In The Respondent Details
            | Select type      | Person                                                                                               |
            | Select title     | Mr                                                                                                   |
            | First name       | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zd |
            | Middle name(s)   | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zd |
            | Surname          | MvVh@&Jwx1tF08W%*9PtbD3a@j&zXbkdCVN!+6hU@KtSw=NrvHFn3UVcCAfPczq#q=+RQ7zQwo%cVC@*dxdf08!xOJn2*=AtV*zd |
            | Date of birth    | <DOB>                                                                                                |
            | Address line 1   | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Address line 2   | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Town or city     | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | County or region | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Post town        | !B9ktg=74tussmheR%pNc!Veqjtd57!y58v                                                                  |
            | Postcode         | SW1A 2AA                                                                                             |
            | Phone number     | 020 7946 0000                                                                                        |
            | Mobile number    | 07123 456789                                                                                         |
            | Email address    | 1Bx0a@example.com                                                                                    |
        When User Clicks On The "Create entry" Button
        # Civil Fee Validation
        Then User Sees Validation Error Banner "There is a problem Select a fee status Enter a valid status date"
        Then User Selects "Due" From The Dropdown "Fee status" In The Accordion "Civil fee"
        Then User Enters "<InvalidSearchDate>" Into The Date Field "Status date" In The Accordion "Civil fee"
        Then User Enters "<PaymentReferenceExceedsLimit>" Into The Textbox "Payment reference" In The Accordion "Civil fee"
        When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
        Then User Sees Validation Error Banner "There is a problem Enter a valid status date A payment reference cannot be supplied when fee status is DUE Payment reference must be 15 characters or fewer"
        Then User Selects "Undertaken" From The Dropdown "Fee status" In The Accordion "Civil fee"
        Then User Enters "<SearchDateFuture>" Into The Date Field "Status date" In The Accordion "Civil fee"
        Then User Enters "<PaymentReferenceUndertaken>" Into The Textbox "Payment reference" In The Accordion "Civil fee"
        When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
        Then User Sees Validation Error Banner "There is a problem Enter a valid status date"
        Then User Enters "<SearchDate>" Into The Date Field "Status date" In The Accordion "Civil fee"
        When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
        Then User Clicks "Change" Link In Row Of Table "Current fee statuses table" In The Accordion "Civil fee"
            #  1st Civil Fee Entry Validations
            | Fee Status | Status Date  | Payment Ref                  |
            | UNDERTAKEN | todaydisplay | <PaymentReferenceUndertaken> |
        Then User Sees Page Heading "Change payment reference"
        Then User Should See Summary List Row With Key "Status" And Value "UNDERTAKEN"
        Then User Should See Summary List Row With Key "Status date" And Value "<DisplayDate>"
        Then User Verifies The "Payment reference" Textbox Has Value "<PaymentReferenceUndertaken>"
        Then User Enters "<UpdatedPaymentReferenceUndertaken>" Into The "Payment reference" Textbox
        When User Clicks On The "Save" Button
        # Verify Wording Success Banner and Wording Value retained after saving payment reference
        Then User Verifies The Textbox "" Contains "<WordingValue>" In The Accordion "Wording"
        Then User Sees Success Alert "Wording applied to this entry. Save the entry to keep these changes."
        # 2nd Civil Fee Entry Validations
        Then User Selects "Paid" From The Dropdown "Fee status" In The Accordion "Civil fee"
        Then User Enters "<SearchDate>" Into The Date Field "Status date" In The Accordion "Civil fee"
        Then User Enters "<PaymentReferencePaid>" Into The Textbox "Payment reference" In The Accordion "Civil fee"
        When User Clicks On The "Add fee details" Button In The Accordion "Civil fee"
        Then User Clicks "Change" Link In Row Of Table "Current fee statuses table" In The Accordion "Civil fee"
            | Fee Status | Status Date  | Payment Ref            |
            | PAID       | todaydisplay | <PaymentReferencePaid> |

        Then User Sees Page Heading "Change payment reference"
        Then User Should See Summary List Row With Key "Status" And Value "PAID"
        Then User Should See Summary List Row With Key "Status date" And Value "<DisplayDate>"
        Then User Verifies The "Payment reference" Textbox Has Value "<PaymentReferencePaid>"
        When User Clicks On The "Cancel" Button
        # Verify Wording Success Banner and Wording Value retained after saving payment reference
        Then User Verifies The Textbox "" Contains "<WordingValue>" In The Accordion "Wording"
        Then User Sees Success Alert "Wording applied to this entry. Save the entry to keep these changes."
        # Notes Validation
        Then User Enters "<CaseReferenceExceedsLimit>" Into The Textbox "Case reference" In The Accordion "Notes"
        Then User Enters "<AccountReferenceExceedsLimit>" Into The Textbox "Account reference" In The Accordion "Notes"
        Then User Enters "<AccountDetails>" Into The Textbox "Application details" In The Accordion "Notes"
        When User Clicks On The "Create entry" Button
        Then User Sees Validation Error Banner "There is a problem Case reference must be 15 characters or fewer Account reference must be 20 characters or fewer"
        Then User Enters "<CaseReference>" Into The Textbox "Case reference" In The Accordion "Notes"
        Then User Enters "<AccountReference>" Into The Textbox "Account reference" In The Accordion "Notes"
        When User Clicks On The "Create entry" Button
        Then User Sees Success Banner "Success Application list entry created The application list entry has been created successfully."

        Examples:
            | User  | TableName | InvalidSearchDate | SearchDate | SearchDateFuture | DisplayDate  | DOB       | Time  | Court                             | Description                             | Entries | Status | SelectButtonText | ButtonName | InvalidApplicationCodeExceedsLimit | InvalidApplicationCode | ValidApplicationCode | ApplicationTitle           | WordingText                                      | placeholder                  | WordingValue        | WordingValueExceedsLimit                                                                              | WordingValue                          | PaymentReferenceExceedsLimit | PaymentReferencePaid | PaymentReferenceUndertaken | UpdatedPaymentReferenceUndertaken | CaseReferenceExceedsLimit | CaseReference | AccountReferenceExceedsLimit | AccountReference | OffsiteFeeString                                                                                         | OffsiteFeeCode | OffsiteFeeValue             | TotalFeeAmount            | FeeReference         | FeeAmount       | AccountDetails                                       |
            | user1 | Lists     | 31/13/2048        | today      | tomorrow         | todaydisplay | today-30y | 10:20 | Leeds Combined Court Centre Set 7 | Applications to review at Test_{RANDOM} | 0       | OPEN   | Select           | Open       | INVALID_CODE                       | CT99002A               | MX99006              | Condemnation of Unfit Food | Application for the condemnation of food, namely | Enter a Describe Seized Food | Test Sample Wording | (ctgn sürrreartcée.sstegl( lmamaeceegScerttpaN( )e -))t,eanoce)erc e(v.etth. abthubienr sa,to,)rtqwer | Test Sample Wording Not Exceeds Limit | PAY-12345-12345-12345        | PAY-12345            | Pay-12345-12345            | Pay-12345-12345                   | case123451234512345       | case12345     | account12345123451234512345  | account12345     | Selecting this will automatically apply the off site fee to the entry. This change is saved immediately. | CO1.1          | Off Site Fee Amount: £30.00 | Total Fee Amount: £284.00 | Fee Reference: CO8.1 | Amount: £284.00 | This is a test application with special requirements |