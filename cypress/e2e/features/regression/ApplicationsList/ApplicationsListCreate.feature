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

  @regression @ARCPOC-214 @ARCPOC-451 @ARCPOC-785 @negative
  Scenario Outline: Verify validation messages on creating applications list with No Input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    Then User Clicks On The Link "Create application"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error "There is a problem Enter day, month and year Enter hours and minutes Description is required Status is required Other location is required CJA is required Court is required"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<InvalidDate>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Enter a real date Enter hours and minutes Description is required Status is required Other location is required CJA is required Court is required"
    When User Set Date Field "Date" To "<ValidDate>"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error "There is a problem Enter hours and minutes Description is required Status is required Other location is required CJA is required Court is required"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<InvalidTime>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Enter a valid duration between 00:00 and 23:59 Description is required Status is required Other location is required CJA is required Court is required"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<ValidTime>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Description is required Status is required Other location is required CJA is required Court is required"
    Then User Enters "<Description>" Into The "Description" Textbox
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Status is required Other location is required CJA is required Court is required"
    Then User Selects "<Status>" In The "Select status" Dropdown
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Other location is required CJA is required Court is required"
    Then User Enters "<OtherLocation>" Into The "Other location" Textbox
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem CJA is required"
    Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<SearchText>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "Success Applications list successfully created"

    Examples:
      | User  | InvalidDate | ValidDate  | InvalidTime | ValidTime | Description     | Status | OtherLocation           | OptionText     | SearchText | 
      | user1 | 32/13/2024  | 01/12/2024 | 25:61       | 14:30     |  Test_{RANDOM}  | Open   | Other Location_{RANDOM} | CJA Number 319 | 319        | 
