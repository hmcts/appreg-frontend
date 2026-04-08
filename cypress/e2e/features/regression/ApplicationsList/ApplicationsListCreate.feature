Feature: Applications List Create
  @regression @applicationsList @ARCPOC-214 @ARCPOC-451 @ARCPOC-793 @ARCPOC-794
  Scenario Outline: Create applications list using CJA and other location
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Create new list"
    Then User Clicks On The Breadcrumb Link "Applications list"
    Then User Clicks On The Link "Create new list"
    # Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<Date>"
    # Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<Time>"
    Then User Enters "<Description>" Into The "List description" Textbox
    Then User Enters "<OtherLocation>" Into The "Other location" Textbox
    Then User Selects "<OptionText>" From The Textbox "Criminal justice area" Autocomplete By Typing "<SearchText>"
    When User Clicks On The "Create" Button
    Then User Sees Success Banner "<SuccessMessage>"
    Then User Verify The Page URL Contains "listCreated=true#list-details"
    Then User Should See The Link "Create application"
    Then User Clicks On The Breadcrumb Link "Applications list"
    When User Searches Application List With:
      | Date   | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | <Date> |      | <Description>    |             |       | <Status>           |                            |                       |           |
    When User Clicks "<SelectButtonText>" Then "Delete" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location     | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <OptionText> | <Description> | <Entries> | <Status> |
    Then User Sees Warning Alert "You are about to delete this Application List and all of the Application List Entries. This action cannot be undone."
    Then User See "Are you sure you want to delete this application list?" On The Page
    When User Clicks On The "Yes - delete" Button
    Then User Sees Page Heading "Applications List"
    Then User Sees Success Banner "Success Application list deleted successfully If you believe this was in error, please contact support."

    Examples:
      | User  | Date  | Time           | Description   | Status | OtherLocation           | SuccessMessage                                                                     | OptionText    | SearchText | TableName | DisplayDate  | Entries | SelectButtonText | ButtonName | HH | MM |
      | user1 | today | timenowhhmm-2h | Test_{RANDOM} | Open   | Other Location_{RANDOM} | Success Application list createdThe application list has been successfully created | Wolverhampton | B9         | Lists     | todaydisplay | 0       | Select           | Open       | 0  | 0  |

  @regression @applicationsList @ARCPOC-214 @ARCPOC-451 @ARCPOC-793 @ARCPOC-794
  Scenario Outline: Create applications list using Court Autocomplete
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Create new list"
    # Then User Clicks On The Breadcrumb Link "Applications list"
    # Then User Clicks On The Link "Create new list"
    # Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<Date>"
    # Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<Time>"
    Then User Enters "<Description>" Into The "List description" Textbox
    Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
    When User Clicks On The "Create" Button
    Then User Sees Success Banner "<SuccessMessage>"
    Then User Verify The Page URL Contains "listCreated=true#list-details"
    Then User Should See The Link "Create application"
    Then User Clicks On The Breadcrumb Link "Applications list"
    When User Searches Application List With:
      | Date   | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | <Date> |      | <Description>    |             |       | <Status>           |                            |                       |           |
    When User Clicks "<SelectButtonText>" Then "Delete" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location     | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <OptionText> | <Description> | <Entries> | <Status> |
    Then User Sees Warning Alert "You are about to delete this Application List and all of the Application List Entries. This action cannot be undone."
    Then User See "Are you sure you want to delete this application list?" On The Page
    When User Clicks On The "Yes - delete" Button
    Then User Sees Page Heading "Applications List"
    Then User Sees Success Banner "Success Application list deleted successfully If you believe this was in error, please contact support."
    Examples:
      | User  | Date  | Time           | Description   | Status | SuccessMessage                                                                     | SearchText | OptionText                    | TableName | DisplayDate  | Entries | SelectButtonText | ButtonName |
      | user1 | today | timenowhhmm-2h | Test_{RANDOM} | Open   | Success Application list createdThe application list has been successfully created | royal      | Royal Courts of Justice Set 1 | Lists     | todaydisplay | 0       | Select           | Open       |

  @regression @applicationsList @ARCPOC-214 @ARCPOC-451 @ARCPOC-793 @ARCPOC-794 @ARCPOC-792 @ARCPOC-1012
  Scenario Outline: Verify validation messages on creating applications list with No Input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Create new list"
    # Then User Clicks On The Breadcrumb Link "Applications list"
    # Then User Clicks On The Link "Create new list"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error Banner "There is a problem Enter day, month and year Enter valid hours and minutes Description is required Enter a court, or an other location and criminal justice area"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<InvalidDate>"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error Banner "There is a problem Enter a valid date Enter valid hours and minutes Description is required Enter a court, or an other location and criminal justice area"
    When User Set Date Field "Date" To "<Date>"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error Banner "There is a problem Enter valid hours and minutes Description is required Enter a court, or an other location and criminal justice area"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<InvalidTime>"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error Banner "There is a problem Enter a valid duration between 00:00 and 23:59 Description is required Enter a court, or an other location and criminal justice area"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<Time>"
    When User Clicks On The "Create" Button
    Then User Sees Validation Error Banner "There is a problem Description is required Enter a court, or an other location and criminal justice area"
    Then User Enters "<Description>" Into The "List description" Textbox
    When User Clicks On The "Create" Button
    Then User Sees Validation Error Banner "There is a problem Enter a court, or an other location and criminal justice area"
    Then User Enters "<InvalidCourt>" Into The "Court" Textbox
    When User Clicks On The "Create" Button
    Then User Sees Validation Error Banner "There is a problem Court location not found"
    Then User Clears The "Court" Textbox
    Then User Enters "<OtherLocation>" Into The "Other location description" Textbox
    When User Clicks On The "Create" Button
    Then User Sees Validation Error Banner "Enter a court, or an other location and criminal justice area Criminal justice area is required"
    Then User Enters "<InvalidCJA>" Into The "Criminal justice area" Textbox
    When User Clicks On The "Create" Button
    Then User Sees Validation Error Banner "There is a problem Criminal justice area not found"
    Then User Clears The "Criminal justice area" Textbox
    Then User Selects "<CJA>" From The Textbox "Criminal justice area" Autocomplete By Typing "<SearchText>"
    When User Clicks On The "Create" Button
    Then User Sees Success Banner "<SuccessMessage>"
    Then User Verify The Page URL Contains "listCreated=true#list-details"
    Then User Should See The Link "Create application"
    Then User Clicks On The Breadcrumb Link "Applications list"
    When User Searches Application List With:
      | Date   | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | <Date> |      | <Description>    |             |       | <Status>           |                            |                       |           |
    When User Clicks "<SelectButtonText>" Then "Delete" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <CJA>    | <Description> | <Entries> | <Status> |
    Then User Sees Warning Alert "You are about to delete this Application List and all of the Application List Entries. This action cannot be undone."
    Then User See "Are you sure you want to delete this application list?" On The Page
    When User Clicks On The "Yes - delete" Button
    Then User Sees Page Heading "Applications List"
    Then User Sees Success Banner "Success Application list deleted successfully If you believe this was in error, please contact support."

    Examples:
      | User  | InvalidDate | Date  | InvalidTime | Time  | Description   | Status | InvalidCourt | OtherLocation           | InvalidCJA | CJA           | SearchText | SuccessMessage                                                                     | TableName | DisplayDate  | Entries | SelectButtonText |
      | user1 | 32/13/2024  | today | 25:61       | 14:30 | Test_{RANDOM} | Open   | abc          | Other Location_{RANDOM} | abc        | Wolverhampton | B9         | Success Application list createdThe application list has been successfully created | Lists     | todaydisplay | 0       | Select           |
