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
