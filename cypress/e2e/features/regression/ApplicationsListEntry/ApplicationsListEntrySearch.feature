Feature: Applications List Entry Search

    @regression @ARCPOC-222 @ARCPOC-442
    Scenario: Verify components on applications list Entry (ALE) search page
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User clicks on the link using exact text match "Applications"
        Then User Verify The Page URL Contains "/applications"
        Then User Should See The Date Field "Date"
        Then User Sees Text "For example, 27 3 2007" In "Date" Field
        Then User Should See The Textbox "Applicant Org"
        Then User Sees Text "Enter the applicants organisation" In "Applicant Org" Field
        Then User Should See The Textbox "Respondent Org"
        Then User Sees Text "Enter the respondents organisation" In "Respondent Org" Field
        Then User Should See The Textbox "Court"
        Then User Sees Text "Enter a description of the court" In "Court" Field
        Then User Should See The Textbox "Applicant surname"
        Then User Sees Text "The applicants last name" In "Applicant surname" Field
        Then User Should See The Textbox "Respondent surname"
        Then User Sees Text "The respondent last name" In "Respondent surname" Field
        Then User Should See The Textbox "List other location"
        Then User Sees Text "Other location description" In "List other location" Field
        Then User Should See The Textbox "Applicant code"
        Then User Sees Text "The standard applicant code" In "Applicant code" Field
        Then User Should See The Textbox "Post code"
        Then User Sees Text "Respondents post code" In "Post code" Field
        Then User Should See The Textbox "CJA"
        Then User Sees Text "Start typing to search" In "CJA" Field
        Then User Should See The Dropdown "Select status"
        Then User Sees Text "Status of the application" In "Select status" Field
        Then User Should See The Textbox "Account reference"
        Then User Sees Text "The account reference code" In "Account reference" Field
        Then User Should See The Button "Search"
        Then User Should See The Button "Clear search"


