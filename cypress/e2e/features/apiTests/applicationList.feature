Feature: API - Application List

  @api @applicationsList @regression @ARCPOC-214 @ARCPOC-772
  Scenario Outline: Create Application List using courtLocationCode via API
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Body:
      | date   | time   | status   | description   | courtLocationCode   | durationHours   | durationMinutes   |
      | <Date> | <Time> | <Status> | <Description> | <CourtLocationCode> | <DurationHours> | <DurationMinutes> |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes GET API Request To "/application-lists/:listId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Property "courtCode" Should Be "<CourtLocationCode>"
    When User Makes GET API Request To "/application-lists?description=<Description>"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | content[0].description | <Description> |
      | content[0].id          | :listId       |
    When User Makes PUT API Request To "/application-lists/:listId" With Body:
      | date   | time   | status   | description         | courtLocationCode   |
      | <Date> | <Time> | <Status> | Updated description | <CourtLocationCode> |
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Property "description" Should Be "Updated description"
    When User Makes DELETE API Request To "/application-lists/:listId"
    Then User Verify Response Status Code Should Be "204"
    Examples:
      | User  | Date     | Time           | Status | Description                                                  | CourtLocationCode | DurationHours | DurationMinutes |
      | user1 | todayiso | timenowhhmm-2h | OPEN   | Applications to review at the Test Courthouse. Test_{RANDOM} | RCJ001            | 2             | 22              |

  @api @applicationsList @regression @ARCPOC-214 @ARCPOC-772
  Scenario Outline: Create Application List using otherLocationDescription and cjaCode via API
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Body:
      | date   | time   | status   | description   | durationHours   | durationMinutes   | otherLocationDescription   | cjaCode   |
      | <Date> | <Time> | <Status> | <Description> | <DurationHours> | <DurationMinutes> | <OtherLocationDescription> | <CjaCode> |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes GET API Request To "/application-lists/:listId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Property "cjaCode" Should Be "<CjaCode>"
    When User Makes DELETE API Request To "/application-lists/:listId"
    Then User Verify Response Status Code Should Be "204"
    Examples:
      | User  | Date     | Time           | Status | Description                             | DurationHours | DurationMinutes | OtherLocationDescription         | CjaCode |
      | user1 | todayiso | timenowhhmm-2h | OPEN   | Applications to review at Test_{RANDOM} | 2             | 22              | Temporary Courtroom at Town Hall | 01      |

