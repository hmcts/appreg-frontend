Feature: Applications List Create
  @regression @ARCPOC-214 @ARCPOC-451 @ARCPOC-793 @ARCPOC-794
  Scenario Outline: Create applications list successfully and verify success message Using Other location and CJA Autocomplete
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Create application"
    Then User Clicks On The Breadcrumb Link 'Applications list'
    Then User Clicks On The Link "Create application"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<Date>"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<Time>"
    Then User Enters "<Description>" Into The "Description" Textbox
    Then User Enters "<OtherLocation>" Into The "Other location" Textbox
    Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<SearchText>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "<NotificationMessage>"
    Then User Clicks On The Link "Click here to go back"
    Then User Should See The Link "Create application"
    When User Set Date Field "Date" To "<Date>"
    Then User Selects "Choose" In The "Select status" Dropdown
    When User Clicks On The "Search" Button
    Then User Should See The Table "Lists"
    Then User Should See Table "Lists" Has Rows
    Then User Should See Row In Table "<TableName>" With Values:
      | Date          | Time   | Location     | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <OptionText> | <Description> | <Entries> | <Status> |
    Examples:
      | User  | Date  | Time           | Description   | Status | OtherLocation           | NotificationMessage                            | OptionText     | SearchText | TableName | DisplayDate | Entries |  SelectButtonText | ButtonName |
      | user1 | today | timenowhhmm-2h | Test_{RANDOM} | Open   | Other Location_{RANDOM} | Success Applications list created successfully | CJA Number 319 | 319        | Lists     | todayiso    | 0       | Select           | Open       |


  @regression @ARCPOC-214 @ARCPOC-451 @ARCPOC-793 @ARCPOC-794
  Scenario Outline: Create applications list successfully and verify success message Using Court Autocomplete
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Create application"
    Then User Clicks On The Breadcrumb Link 'Applications list'
    Then User Clicks On The Link "Create application"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<Date>"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<Time>"
    Then User Enters "<Description>" Into The "Description" Textbox
    Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "<NotificationMessage>"
    Then User Clicks On The Link "Click here to go back"
    Then User Should See The Link "Create application"
    When User Set Date Field "Date" To "<Date>"
    Then User Selects "Choose" In The "Select status" Dropdown
    When User Clicks On The "Search" Button
    Then User Should See The Table "Lists"
    Then User Should See Table "Lists" Has Rows
    Then User Should See Row In Table "<TableName>" With Values:
      | Date          | Time   | Location     | Description   | Entries   | Status   |
     | <DisplayDate> | <Time> | <OptionText> | <Description> | <Entries> | <Status> |
   #  When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
    #   | Date          | Time   | Location | Description   | Entries   | Status   |
    #   | <DisplayDate> | <Time> | <OptionText>  | <Description> | <Entries> | <Status> |
    # Then User Should See The Link "List details"
    Examples:
      | User  | Date  | Time           | Description   | Status | NotificationMessage                            | SearchText | OptionText                    | TableName | DisplayDate | Entries | SelectButtonText | ButtonName |
      | user1 | today | timenowhhmm-2h | Test_{RANDOM} | Open   | Success Applications list created successfully | royal      | Royal Courts of Justice Set 1 | Lists     | todayiso    | 0       | Select           | Open       |

  @regression @ARCPOC-214 @ARCPOC-451 @ARCPOC-793 @ARCPOC-794 @ARCPOC-792
  Scenario Outline: Verify validation messages on creating applications list with No Input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Create application"
    Then User Clicks On The Breadcrumb Link 'Applications list'
    Then User Clicks On The Link "Create application"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error "There is a problem Enter day, month and year Enter hours and minutes Description is required Other location is required CJA is required Court is required"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<InvalidDate>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Enter a real date Enter hours and minutes Description is required Other location is required CJA is required Court is required"
    When User Set Date Field "Date" To "<ValidDate>"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error "There is a problem Enter hours and minutes Description is required Other location is required CJA is required Court is required"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<InvalidTime>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Enter a valid duration between 00:00 and 23:59 Description is required Other location is required CJA is required Court is required"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<ValidTime>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Description is required Other location is required CJA is required Court is required"
    Then User Enters "<Description>" Into The "Description" Textbox
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Other location is required CJA is required Court is required"
    Then User Enters "<InvalidCourt>" Into The "Court" Textbox
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Court Location not found"
    Then User Clears The "Court" Textbox
    Then User Enters "<OtherLocation>" Into The "Other location" Textbox
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem CJA is required"
    Then User Enters "<InvalidCJA>" Into The "CJA" Textbox
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "There is a problem Criminal Justice Area not found"
    Then User Clears The "CJA" Textbox
    Then User Selects "<ValidCJA>" From The Textbox "CJA" Autocomplete By Typing "<SearchText>"
    When User Clicks On The "Create" Button
    Then User Sees Notification Banner "<NotificationMessage>"
    Then User Clicks On The Link "Click here to go back"
    Then User Should See The Link "Create application"

    Examples:
      | User  | InvalidDate | ValidDate  | InvalidTime | ValidTime | Description   | Status | InvalidCourt | OtherLocation           | InvalidCJA | ValidCJA       | SearchText | NotificationMessage                            |
      | user1 | 32/13/2024  | 01/12/2024 | 25:61       | 14:30     | Test_{RANDOM} | Open   | abc          | Other Location_{RANDOM} | abc        | CJA Number 319 | 319        | Success Applications list created successfully |
