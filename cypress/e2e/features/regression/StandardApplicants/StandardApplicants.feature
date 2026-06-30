Feature: Standard Applicants

    @standardApplicants @regression @ARCPOC-1189
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

    @standardApplicants @regression @ARCPOC-297
    Scenario Outline: Verify Standard Applicant page initial state and search functionality
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"

        # Navigate to the Standard Applicants page and verify the initial state of the page
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Should See The Textbox "Code"
        Then User Should See The Textbox "Standard applicant name"
        Then User Should See The Button "Search"
        Then User Should Not See The Element "<TableName>"

        # Click the "Search" button to retrieve all standard applicants and verify the table is displayed with the correct headers and sort orders
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Rows
        Then User Should See Table "<TableName>" Header "Code" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Header "Name" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Address" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Use from" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Use to" Has Sort Order "none"

        Examples:
            | TableName           |
            | Standard applicants |


    @standardApplicants @regression @ARCPOC-297
    Scenario Outline: Verify Standard Applicant search functionality by code
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"

        # Navigate to the Standard Applicants page and verify the initial state of the page
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Should See The Textbox "Code"
        Then User Should See The Textbox "Standard applicant name"
        Then User Should See The Button "Search"
        Then User Should Not See The Element "<TableName>"

        # Test the search functionality by entering a code and verifying that the table displays the correct results
        Then User Enters "APP001" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has 1 Rows
        Then User Should See Table "<TableName>" Header "Code" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Header "Name" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Address" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Use from" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Use to" Has Sort Order "none"
        Then User Should See Row In Table "<TableName>" With Values:
            | Code   | Name       | Address         | Use from   | Use to |
            | APP001 | John Smith | 123 High Street | 6 Nov 2025 | -      |
        Examples:
            | TableName           |
            | Standard applicants |

    @standardApplicants @regression @ARCPOC-297
    Scenario Outline: Verify Standard Applicant search functionality by name
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"

        # Navigate to the Standard Applicants page and verify the initial state of the page
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Should See The Textbox "Code"
        Then User Should See The Textbox "Standard applicant name"
        Then User Should See The Button "Search"
        Then User Should Not See The Element "<TableName>"

        # Test the search functionality by entering a code and verifying that the table displays the correct results
        Then User Enters "John Smith" Into The "Standard applicant name" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has 1 Rows
        Then User Should See Table "<TableName>" Header "Code" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Header "Name" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Address" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Use from" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Use to" Has Sort Order "none"
        Then User Should See Row In Table "<TableName>" With Values:
            | Code   | Name       | Address         | Use from   | Use to |
            | APP001 | John Smith | 123 High Street | 6 Nov 2025 | -      |

        Examples:
            | TableName           |
            | Standard applicants |

    @standardApplicants @regression @ARCPOC-297
    Scenario Outline: Verify Standard Applicant search functionality by code and name
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"

        # Navigate to the Standard Applicants page and verify the initial state of the page
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Should See The Textbox "Code"
        Then User Should See The Textbox "Standard applicant name"
        Then User Should See The Button "Search"
        Then User Should Not See The Element "<TableName>"

        Then User Enters "John Smith" Into The "Standard applicant name" Textbox
        Then User Enters "APP001" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has 1 Rows
        Then User Should See Table "<TableName>" Header "Code" Has Sort Order "ascending"
        Then User Should See Table "<TableName>" Header "Name" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Address" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Use from" Has Sort Order "none"
        Then User Should See Table "<TableName>" Header "Use to" Has Sort Order "none"
        Then User Should See Row In Table "<TableName>" With Values:
            | Code   | Name       | Address         | Use from   | Use to |
            | APP001 | John Smith | 123 High Street | 6 Nov 2025 | -      |

        Examples:
            | TableName           |
            | Standard applicants |

    Scenario Outline: Verify Standard Applicant clear search functionality
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"

        # Navigate to the Standard Applicants page and verify the initial state of the page
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Should See The Textbox "Code"
        Then User Should See The Textbox "Standard applicant name"
        Then User Should See The Button "Search"
        Then User Should Not See The Element "<TableName>"

        # Test the search functionality by entering a code and verifying that the table displays the correct results
        Then User Enters "APP001" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has 1 Rows

        # Clear the search criteria and verify that the table is no longer displayed
        When User Clicks On The "Clear" Button
        Then User Should Not See The Element "<TableName>"

        Examples:
            | TableName           |
            | Standard applicants |

    Scenario Outline: Verify Standard Applicant search functionality with no results
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"

        # Navigate to the Standard Applicants page and verify the initial state of the page
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Should See The Textbox "Code"
        Then User Should See The Textbox "Standard applicant name"
        Then User Should See The Button "Search"
        Then User Should Not See The Element "<TableName>"

        # Test the search functionality by entering a code and verifying that the table displays the correct results
        Then User Enters "APP99999" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should Not See The Element "<TableName>"
        Then User Sees Notification Banner "No standard applicants found Try different filters"

        Examples:
            | TableName           |
            | Standard applicants |

    Scenario Outline: Verify Standard Applicant search functionality with invalid code length
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Standard applicants"

        # Navigate to the Standard Applicants page and verify the initial state of the page
        Then User Verify The Page URL Contains "/standard-applicants"
        Then User Sees Page Heading "Standard applicants"
        Then User Should See The Textbox "Code"
        Then User Should See The Textbox "Standard applicant name"
        Then User Should See The Button "Search"
        Then User Should Not See The Element "<TableName>"

        # Test the search functionality by entering a code and verifying that the table displays the correct results
        Then User Enters "qwerasdfzxcv" Into The "Code" Textbox
        When User Clicks On The "Search" Button
        Then User Should Not See The Element "<TableName>"
        Then User Sees Validation Error Banner "There is a problem Code must be 10 characters or fewer"

        Examples:
            | TableName           |
            | Standard applicants |