Feature: Applications list entry create help details

  Background: Create applications list
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                         | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Entry create help list {RANDOM}     | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"

  @regression @applicationListEntry @helpDetails
  Scenario: Expand and collapse create entry help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/applications-list/:listId/create-entry"
    Then User Sees Page Heading "Create new entry"
    When User Clicks On The "Show all sections" Button

    When User Toggles The Accordion "Help with applicant details"
    Then User Should See The Text "Enter applicant details for a single applicant or organisation." In The Accordion "Help with applicant details"
    Then User Should See The Text "If you select a standard applicant, you can choose a different standard applicant, but you cannot edit the standard applicant" In The Accordion "Help with applicant details"
    Then User Should See The Text "The selected standard applicant is shown above the search results." In The Accordion "Help with applicant details"
    Then User Takes Screenshot "HelpDetails-ALECreate-Applicant-Expanded"
    When User Toggles The Accordion "Help with applicant details"

    When User Toggles The Accordion "Help with application codes"
    Then User Should See The Text "Select the application code that matches the nature of the application being recorded." In The Accordion "Help with application codes"
    Then User Should See The Text "The lodgement date is the date the court office received the application." In The Accordion "Help with application codes"
    Then User Should See The Text "The lodgement date is used to find the correct fee for the date the application was received." In The Accordion "Help with application codes"
    Then User Should See The Text "Once the lodgement date is saved it cannot be changed." In The Accordion "Help with application codes"
    Then User Takes Screenshot "HelpDetails-ALECreate-ApplicationCodes-Expanded"
    When User Toggles The Accordion "Help with application codes"

    When User Toggles The Accordion "Help with application wording"
    Then User Should See The Text "Application wording is based on the selected application code and may include fixed text and fields you need to complete." In The Accordion "Help with application wording"
    Then User Takes Screenshot "HelpDetails-ALECreate-ApplicationWording-Expanded"
    When User Toggles The Accordion "Help with application wording"

    When User Toggles The Accordion "Help with civil fee details"
    Then User Should See The Text "Civil fee details record whether an application fee is due, paid, remitted or covered by an undertaking." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Due means the fee still needs to be paid or resolved." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Paid means the fee has been paid in full. You can add a payment reference if needed." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Remitted means the court has waived the fee, for example through Help with Fees." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Undertaking means the applicant has formally agreed to pay later. The list cannot be closed until this is updated to Paid." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Applications that do not need a fee show No fee required and the fee fields cannot be changed." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Select Off-site fee if an additional fee applies because a magistrate attended a location away from court premises." In The Accordion "Help with civil fee details"
    Then User Takes Screenshot "HelpDetails-ALECreate-CivilFee-Expanded"
    When User Toggles The Accordion "Help with civil fee details"

    When User Toggles The Accordion "Help with application notes"
    Then User Should See The Text "Use this section to record case references, account references and any additional notes for the application." In The Accordion "Help with application notes"
    Then User Should See The Text "Account reference is required for enforcement application codes prefixed with EF." In The Accordion "Help with application notes"
    Then User Takes Screenshot "HelpDetails-ALECreate-Notes-Expanded"
    When User Toggles The Accordion "Help with application notes"
