Feature: List Maintenance Report

    @regression @reports @ARCPOC-250
    Scenario: Private prosecutors index Report - Render report filters
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        Then User See "Reports" On The Page
        Then User See "Select the report you wish to download?" On The Page
        When User Selects The Radio Button "Private prosecutors index"
        Then User See "Private prosecutors index" On The Page
        Then User Should See The Date Field "Date from"
        Then User Should See The Date Field "Date to"
        Then User Should See The Textbox "Applicant organisation name"
        Then User Should See The Textbox "Applicant first name"
        Then User Should See The Textbox "Applicant last name"
        When User Toggles The Accordion "Advanced filters"
        Then User Should See The Textbox "Standard applicant name"
        Then User Should See The Textbox "Respondent first name"
        Then User Should See The Textbox "Respondent surname"
        Then User Should See The Textbox "Respondent organisation"
        Then User Should See The Textbox "Court"
        Then User Should See The Textbox "Criminal justice area"
        Then User Should See The Textbox "Other location description"