Feature: Standard Applicants

    @regression @standardApplicants @ARCPOC-1189 @ARCPOC-762
    Scenario Outline: Verify Standard Applicant sorting behaviour
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Should See The Textbox "Code"
        Then User Should See The Textbox "Standard applicant name"
        Then User Should See The Button "Search"
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Code" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Header "Name" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Address" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Use from" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Use to" Has Sort Order "none"

        # Test default sort cycle: ascending -> descending -> ascending
        When User Clicks On Table Header "Code" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Code" Has Sort Order "descending"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks On Table Header "Code" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Code" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Has Rows

        # Test sort cycle: none -> ascending -> descending
        When User Clicks On Table Header "Name" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Name" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks On Table Header "Name" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Name" Has Sort Order "descending"
        Then User Should See Table "<TableName>" Has Rows

        When User Clicks On Table Header "Address" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Address" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks On Table Header "Address" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Address" Has Sort Order "descending"
        Then User Should See Table "<TableName>" Has Rows

        When User Clicks On Table Header "Use from" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Use from" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks On Table Header "Use from" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Use from" Has Sort Order "descending"
        Then User Should See Table "<TableName>" Has Rows

        When User Clicks On Table Header "Use to" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Use to" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks On Table Header "Use to" In Table "<TableName>"
        Then User Should See Table "<TableName>" Header "Use to" Has Sort Order "descending"
        Then User Should See Table "<TableName>" Has Rows

        Examples:
            | TableName           |
            | Standard applicants |

    @regression @standardApplicants @ARCPOC-762
    Scenario Outline: Verify Standard Applicant Search functionality
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Enters "<ExceedingLengthCode>" Into The "Code" Textbox
        Then User Enters "<ExceedingLengthName>" Into The "Standard applicant name" Textbox
        When User Clicks On The "Search" Button
        Then User Sees Validation Error Banner "There is a problem Code must be 10 characters or fewer Standard applicant name must be 100 characters or fewer"
        When User Clicks On The "Clear search" Button
        Then User Enters "<InvalidCode>" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User See "No results found." On The Page
        Then User Sees Notification Banner "Important No standard applicants found Try different filters"
        When User Clicks On The "Clear search" Button
        Then User Enters "<Code>" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Rows
        Then User Should See The Button "Actions" Is Enabled
        When User Clicks "Actions" Then Sees The Caption Menu With Options "Export, Print" In Table "<TableName>"

        Examples:
            | ExceedingLengthCode | ExceedingLengthName                                                                                             | InvalidCode | Code | TableName           |
            | 12345678901         | A very long name that exceeds the maximum length of 100 characters for a standard applicant name in the system. | 1234567890  | app  | Standard applicants |

    @regression @standardApplicants @ARCPOC-766
    Scenario: View a Standard Applicant in read-only mode
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Enters "app" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "Standard applicants"
        Then User Should See Table "Standard applicants" Has Rows
        And User Should See Row In Table "Standard applicants" With Values:
            | Code   | Name       | Address         | Use from   |
            | APP001 | John Smith | 123 High Street | 6 Nov 2025 |
        When User Clicks "View" Button In Row Of Table "Standard applicants" With:
            | Code   | Name       | Address         | Use from   |
            | APP001 | John Smith | 123 High Street | 6 Nov 2025 |
        Then User Verify The Page URL Contains "/standard-applicants/APP001"
        And User Sees Page Heading "Standard applicant details"
        And User Should See Summary List Row With Key "Code" And Value "APP001"
        And User Should See Summary List Row With Key "Standard applicant name" And Value "John Smith"
        And User Should See Summary List Row With Key "Address line 1" And Value "123 High Street"
        And User Should See Summary List Row With Key "Use from" And Value "6 Nov 2025"

    @regression @standardApplicants @ARCPOC-243
    Scenario: Export Standard Applicants as a CSV
        Given User Is On The Portal Page
        And User Has No Downloaded CSVs
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Enters "1234567890" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User See "No results found." On The Page
        And User Sees Notification Banner "Important No standard applicants found Try different filters"
        And User Should Not See The Button "Actions"
        When User Clicks On The "Clear search" Button
        Then User Enters "APP001" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "Standard applicants"
        Then User Should See Table "Standard applicants" Header "Code" Has Sort Order "ascending"
        And User Should See Row In Table "Standard applicants" With Values:
            | Code   | Name       | Address         | Use from   |
            | APP001 | John Smith | 123 High Street | 6 Nov 2025 |
        When User Clicks "Actions" Then "Export CSV" From Caption Menu In Table "Standard applicants"
        Then User Verifies CSV ".csv" Is Downloaded
        And User Verifies The Downloaded CSV Has Headers In Row 1:
            | Applicant Code |
            | Name           |
            | Use From       |
            | Use To         |
        And User Verifies Latest Downloaded CSV Contains Text "APP001"

    @regression @standardApplicants @ARCPOC-242
    Scenario: Print Standard Applicants as a PDF
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Enters "APP001" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "Standard applicants"
        Then User Should See Table "Standard applicants" Header "Code" Has Sort Order "ascending"
        And User Should See Row In Table "Standard applicants" With Values:
            | Code   | Name       | Address         | Use from   |
            | APP001 | John Smith | 123 High Street | 6 Nov 2025 |
        When User Clicks "Actions" Then "Print PDF" From Caption Menu In Table "Standard applicants"
        Then User Sees Success Banner "Success Successfully printed PDF Standard applicant PDF has been successfully printed"
        Then User Verifies PDF ".pdf" Is Downloaded
        And User Verifies Latest Downloaded PDF Is Not Empty
        And User Verifies Latest Downloaded PDF Contains Text "Standard applicants report"
        And User Verifies Latest Downloaded PDF Contains Text "Code: APP001"
        And User Verifies Latest Downloaded PDF Contains The Following Values:
            | Code             | APP001                 |
            | Name             | —                      |
            | Title            | Mr                     |
            | Forename 1       | John                   |
            | Forename 2       | —                      |
            | Forename 3       | —                      |
            | Surname          | Smith                  |
            | Address line 1   | 123 High Street        |
            | Address line 2   | —                      |
            | Address line 3   | —                      |
            | Address line 4   | Townsville             |
            | Address line 5   | —                      |
            | Postcode         | TS1 1AB                |
            | Email address    | john.smith@example.com |
            | Telephone number | 01234567890            |
            | Mobile number    | 07123456789            |
            | Use from         | 6 Nov 2025             |
            | Use to           | —                      |
        And User Verifies Latest Downloaded PDF Does Not Contain The Following Values:
            | id      |
            | version |
