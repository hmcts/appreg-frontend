Feature: Applications Register Portal Access

  @smoke @authentication @ARCPOC-294 @ARCPOC-426
  Scenario: Verify portal access and SSO login flow
    Given User Is On The Portal Page
    Then User Verify The Page Title Is "HMCTS Applications Register - Home - GOV.UK"
    And User See "Applications register" On The Page
    And User See "Sign in" On The Page
    And User See "To access this service, you now must use the Ministry of Justice Modernisation Platform’s Single Sign On (SSO):" On The Page
    Then User Should See The Button "Sign in with your Justice SSO account"

  @smoke @authentication @ARCPOC-294 @ARCPOC-426
  Scenario Outline: Sign in and Sign out flow for "<role>"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<role>"
    Then User See "Applications register" On The Page
    Then User Verify The Page URL Contains "/applications-list"
    Then User Signs Out From The Application
    Then User Verify The Page URL Contains "/login"
    Examples:
      | role   |
      | user2  |
      | admin2 |

  @ignore @IngestStandardApplicants @ARCPOC-1537
  Scenario Outline: Ingestion Test Standard Applicants
    Given User Authenticates Via API As "user1"
    When User Makes Multipart POST API Request To "/admin/csds/standard_applicants/ingest" With Fixture File "<FileName>" And Content Type "application/json"
    Then User Verify Response Status Code Should Be "403"
    Then User Verify Response Body Should Have:
      | title  | Forbidden     |
      | status | 403           |
      | detail | Access denied |
    Given User Authenticates Via API As "admin1"
    When User Makes Multipart POST API Request To "/admin/csds/standard_applicants/ingest" With Fixture File "<FileName>" And Content Type "application/json"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | inserted | <Inserted> |
      | updated  | <Updated>  |
    Examples:
      | FileName                        | Inserted | Updated |
      | standard_applicants_merged.json | 0        | 361     |
