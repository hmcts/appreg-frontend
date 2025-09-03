Feature: Application Register Portal Access

  @smoke
  Scenario: Verify portal access and SSO login flow
    Given User Is On The Portal Page
    Then User Verify The Page Title Is "HMCTS Applications Register - Home - GOV.UK"
    And User See "Application register" On The Page
    And User See "Sign in" On The Page
    And User See "To access this service, you now must use the Ministry of Justice Modernisation Platform’s Single Sign On (SSO):" On The Page
    When User Verifies The Button "Sign in with your Justice SSO account" Should Be Visible
    Then User Signs In With Microsoft SSO As "default"
    And User See "Application register" On The Page



  