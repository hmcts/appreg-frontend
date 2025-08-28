Feature: Smoke Test

  Scenario: Visit the base URL
    Given User Is On The Portal Page
    Then User Verify The Page Title Is "HMCTS Applications Register - Home - GOV.UK"
    Then User See "Application register" On The Page
    Then User See "Sign in" On The Page
    Then User See "To access this service, you now must use the Ministry of Justice Modernisation Platform’s Single Sign On (SSO):" On The Page
    Then User Clicks On "Sign in with your Justice SSO account" Button


