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
        When User Clicks "Actions" Then Sees The Caption Menu With Options "Export CSV, Print PDF" In Table "<TableName>"

        Examples:
            | ExceedingLengthCode | ExceedingLengthName                                                                                             | InvalidCode | Code | TableName           |
            | 12345678901         | A very long name that exceeds the maximum length of 100 characters for a standard applicant name in the system. | 1234567890  | ad   | Standard applicants |

    @regression @standardApplicants @ARCPOC-766
    Scenario: View a Standard Applicant in read-only mode
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Enters "BGAS" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "Standard applicants"
        Then User Should See Table "Standard applicants" Has Rows
        And User Should See Row In Table "Standard applicants" With Values:
            | Code | Name                        | Address    | Use from   |
            | BGAS | British Gas Trading Limited | Millstream | 1 Jun 2016 |
        When User Clicks "View" Button In Row Of Table "Standard applicants" With:
            | Code | Name                        | Address    | Use from   |
            | BGAS | British Gas Trading Limited | Millstream | 1 Jun 2016 |
        Then User Verify The Page URL Contains "/standard-applicants/BGAS"
        And User Sees Page Heading "Standard applicant details"
        And User Should See Summary List Row With Key "Code" And Value "BGAS"
        And User Should See Summary List Row With Key "Standard applicant name" And Value "British Gas Trading Limited"
        And User Should See Summary List Row With Key "Address line 1" And Value "Millstream"
        And User Should See Summary List Row With Key "Use from" And Value "1 Jun 2016"

    @regression @standardApplicants @ARCPOC-243 @ARCPOC-1613
    Scenario: Export Standard Applicants as a CSV
        Given User Is On The Portal Page
        And User Has No Downloaded CSVs
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        # Search and export CSV without providing code or name filters
        When User Clicks On The "Search" Button
        Then User Should See The Table "Standard applicants"
        Then User Should See Table "Standard applicants" Has Rows
        When User Clicks "Actions" Then "Export CSV" From Caption Menu In Table "Standard applicants"
        Then User Sees Validation Error Banner "There is a problem Either code or name must be provided, but not both. Please perform a search with either code or name"
        # Search and export CSV with invalid code filter
        Then User Enters "1234567890" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User See "No results found." On The Page
        And User Sees Notification Banner "Important No standard applicants found Try different filters"
        And User Should Not See The Button "Actions"
        When User Clicks On The "Clear search" Button
        # Search and export CSV with valid code filter
        Then User Enters "BGAS" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "Standard applicants"
        Then User Should See Table "Standard applicants" Header "Code" Has Sort Order "ascending"
        And User Should See Row In Table "Standard applicants" With Values:
            | Code | Name                        | Address    | Use from   |
            | BGAS | British Gas Trading Limited | Millstream | 1 Jun 2016 |
        When User Clicks "Actions" Then "Export CSV" From Caption Menu In Table "Standard applicants"
        Then User Verifies CSV ".csv" Is Downloaded
        And User Verifies The Downloaded CSV Has Headers In Row 1:
            | Applicant Code |
            | Name           |
            | Use From       |
            | Use To         |
        And User Verifies Latest Downloaded CSV Contains Text "BGAS"

    @regression @standardApplicants @ARCPOC-242
    Scenario: Print Standard Applicants as a PDF
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Enters "BGAS" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "Standard applicants"
        Then User Should See Table "Standard applicants" Header "Code" Has Sort Order "ascending"
        And User Should See Row In Table "Standard applicants" With Values:
            | Code | Name                        | Address    | Use from   |
            | BGAS | British Gas Trading Limited | Millstream | 1 Jun 2016 |
        When User Clicks "Actions" Then "Print PDF" From Caption Menu In Table "Standard applicants"
        Then User Sees Success Banner "Success Successfully printed PDF Standard applicant PDF has been successfully printed"
        Then User Verifies PDF ".pdf" Is Downloaded
        And User Verifies Latest Downloaded PDF Is Not Empty
        And User Verifies Latest Downloaded PDF Contains Text "Standard applicants report"
        And User Verifies Latest Downloaded PDF Contains Text "Code: BGAS"
        And User Verifies Latest Downloaded PDF Contains The Following Values:
            | Code             | BGAS                        |
            | Name             | British Gas Trading Limited |
            | Title            | -                           |
            | Forename 1       | -                           |
            | Forename 2       | —                           |
            | Forename 3       | —                           |
            | Surname          | -                           |
            | Address line 1   | Millstream                  |
            | Address line 2   | Maidenhead Road             |
            | Address line 3   | Windsor                     |
            | Address line 4   | Berkshire                   |
            | Address line 5   | —                           |
            | Postcode         | SL4 5GD                     |
            | Email address    | -                           |
            | Telephone number | -                           |
            | Mobile number    | -                           |
            | Use from         | 1 Jun 2016                  |
            | Use to           | —                           |
        And User Verifies Latest Downloaded PDF Does Not Contain The Following Values:
            | ApplicantID |
            | version     |
