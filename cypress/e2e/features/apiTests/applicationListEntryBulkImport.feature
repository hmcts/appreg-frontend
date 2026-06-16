Feature: API - Application List Entry Bulk Import

  @api @applicationListEntry @regression @ARCPOC-632 @ARCPOC-821
  Scenario Outline: Accept valid CSV bulk upload submission
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                  |
      | time              | timenowhhmm-2h            |
      | status            | OPEN                      |
      | description       | Bulk import list {RANDOM} |
      | courtLocationCode | RCJ001                    |
      | durationHours     | 2                         |
      | durationMinutes   | 22                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes Multipart POST API Request To "/application-lists/:listId/entries/bulk-import" With Fixture File "bulk-upload-entries.csv" And Content Type "text/csv"
    Then User Verify Response Status Code Should Be "202"
    Then User Verify Response Header "Location" Should Be Present
    Then User Verify Response Header "Location" Should Contain "/jobs/"
    Then User Verify Response Body Should Have:
      | type   | BULK_UPLOAD_ENTRIES |
      | status | RECEIVED            |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-632
  Scenario Outline: Reject bulk upload file with invalid CSV content
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                           |
      | time              | timenowhhmm-2h                     |
      | status            | OPEN                               |
      | description       | Bulk import invalid media {RANDOM} |
      | courtLocationCode | RCJ001                             |
      | durationHours     | 2                                  |
      | durationMinutes   | 22                                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes Multipart POST API Request To "/application-lists/:listId/entries/bulk-import" With Fixture File "sample.txt" And Content Type "text/plain"
    Then User Verify Response Status Code Should Be "400"

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-632
  Scenario Outline: Reject bulk upload requests with unsupported request media type
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                               |
      | time              | timenowhhmm-2h                         |
      | status            | OPEN                                   |
      | description       | Bulk import unsupported media {RANDOM} |
      | courtLocationCode | RCJ001                                 |
      | durationHours     | 2                                      |
      | durationMinutes   | 22                                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes Raw POST API Request To "/application-lists/:listId/entries/bulk-import" With Body "not-a-multipart-request" And Headers:
      | Content-Type | text/plain |
    Then User Verify Response Status Code Should Be "415"

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-632
  Scenario Outline: Reject malformed bulk upload CSV headers
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                           |
      | time              | timenowhhmm-2h                     |
      | status            | OPEN                               |
      | description       | Bulk import wrong headers {RANDOM} |
      | courtLocationCode | RCJ001                             |
      | durationHours     | 2                                  |
      | durationMinutes   | 22                                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes Multipart POST API Request To "/application-lists/:listId/entries/bulk-import" With Fixture File "bulk-upload-wrong-headers.csv" And Content Type "text/csv"
    Then User Verify Response Status Code Should Be "400"

    Examples:
      | User  |
      | user1 |
