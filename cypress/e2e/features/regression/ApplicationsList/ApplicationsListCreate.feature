Feature: Applications List Create

  @ARCPOC
  Scenario Outline: Verify applications list is displayed
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    Then User Clicks On The Link "Create a new list"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<Date>"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<Time>"
    Then User Enters "<Description>" Into The "Description" Textbox
    Then User Selects "<Status>" In The "Select status" Dropdown
    Then User Enters "<Court>" Into The "Court" Textbox
    Then User Enters "<OtherLocation>" Into The "Other location" Textbox
    Then User Enters "<CJA>" Into The "CJA" Textbox
    When User Clicks On The "Create" Button
    Examples:
      | User  | Date  | Time       | Description   | Status | Court          | OtherLocation           | CJA |
      | user1 | today | timenow-2h | Test_{RANDOM} | Open   | Court_{RANDOM} | Other Location_{RANDOM} | CJA |

  @regression @ARCPOC-214 @ARCPOC-451
  Scenario Outline: Create applications list successfully and verify success message
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    Then User Clicks On The Link "Create application"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<Date>"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<Time>"
    Then User Enters "<Description>" Into The "Description" Textbox
    Then User Selects "<Status>" In The "Select status" Dropdown
    Then User Enters "<OtherLocation>" Into The "Other location" Textbox
    Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<SearchText>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "<NotificationMessage>"
    Examples:
      | User  | Date  | Time       | Description   | Status | Court          | OtherLocation           | NotificationMessage                            | OptionText     | SearchText |
      | user1 | today | timenow-2h | Test_{RANDOM} | Open   | Court_{RANDOM} | Other Location_{RANDOM} | Success Applications list successfully created | CJA Number 319 | 319        |

  @regression @ARCPOC-214 @ARCPOC-451 @negative
  Scenario Outline: Verify validation messages on creating applications list with No Input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    Then User Clicks On The Link "Create application"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error "Error - please check your inputs: Enter day, month and year Enter hours and minutes Description is required Status is required Other location is required CJA is required Court is required"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<InvalidDate>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "Error - please check your inputs: Enter a real date Enter hours and minutes Description is required Status is required Other location is required CJA is required Court is required"
    When User Set Date Field "Date" To "<ValidDate>"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error "Error - please check your inputs: Enter hours and minutes Description is required Status is required Other location is required CJA is required Court is required"
    Then User Clicks On The Link "Applications list"


    Examples:
      | User  | Date   | Time   | Description | Status | Court  | OtherLocation | CJA    | InvalidDate | ValidDate  |
      | user1 | *SKIP* | *SKIP* | *SKIP*      | *SKIP* | *SKIP* | *SKIP*        | *SKIP* | 32/13/2024  | 01/12/2024 |
