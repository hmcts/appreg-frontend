Feature: Authentication and Authorisation    
  I want to authenticate and authorise using Microsoft SSO
  So that I can access the application securely

  @regression @ARCPOC-426
  Scenario: Successful Login and Invalid or expired token
    Given User Is On The Portal Page
    Then User Verify The Page URL Contains "/login"
    When User Signs In With Microsoft SSO As "user1"
    Then User Verify The Page URL Contains "/applications-list"
    Then User Verify The "appreg.sid" Cookie Should Exist
    When User Clears Cookies And Storage
    When User Refreshes The Page
    Then User Verify The Page URL Contains "/login"

  @regression @ARCPOC-426
  Scenario: Redirect on unauthenticated access
    Given User Navigates To The URL "/applications-list"
    Then User Verify The Page URL Contains "/login"
    When User Clicks On The "Sign in with your Justice SSO account" Button
    Then User Should Not See The Element "app-login"

  @regression @ARCPOC-426
  Scenario: Sign out
    Given User Is On The Portal Page
    Then User Verify The Page URL Contains "/login"
    When User Signs In With Microsoft SSO As "user1"
    Then User Verify The Page URL Contains "/applications-list"
    Then User Signs Out From The Application
    Then User Verify The Page URL Contains "/login"

  @regression @ARCPOC-426 @accessibility
  Scenario: Accessibility check on Login Page
    Given User Is On The Portal Page
    Then User Checks Accessibility Of The Current Page

  @regression @ARCPOC-426
  Scenario: Verify SSO login flow
    Given User Is On The Portal Page
    Then User Verify The Page Title Is "HMCTS Applications Register - Home - GOV.UK"
    And User See "Applications register" On The Page
    And User See "Sign in" On The Page
    And User See "To access this service, you now must use the Ministry of Justice Modernisation Platform’s Single Sign On (SSO):" On The Page
    Then User Should See The Button "Sign in with your Justice SSO account"
    When User Signs In With Microsoft SSO As "user1"
    Then User See "Applications register" On The Page

  @regression @ARCPOC-426
  Scenario: Verify error on invalid email
    Given User Is On The Portal Page
    When User Tries To Sign In With Invalid Email "invalid_email@hmcts.net" And Expects Error "This username may be incorrect. Make sure you typed it correctly. Otherwise, contact your admin."

    @regression @ARCPOC-426
  Scenario: Verify error on valid email and invalid password
    Given User Is On The Portal Page
    When User Tries To Sign In With Valid Email "ar-test-1@hmcts.net" And Invalid Password "any_password" And Expects Error "Your account or password is incorrect. If you don't remember your password, reset it now."

  @regression @ARCPOC-425
  Scenario: Complete authentication flow with session and token validation
    Given User Navigates To The URL "/applications-list"
    Then User Verify The Page URL Contains "/login"
    When User Signs In With Microsoft SSO As "user1"
    Then User Verify The Page URL Contains "/applications-list"
    Then User Verify The "appreg.sid" Cookie Should Exist
    Then User Verify The Session Is Valid

 @regression @ARCPOC-425
  Scenario: Protected route access with active session
    When User Signs In With Microsoft SSO As "user1"
    Then User Verify The Page URL Contains "/applications-list"
    Then User Verify The "appreg.sid" Cookie Should Exist
    Then User Verify The Session Is Valid

  @regression @ARCPOC-425
  Scenario: API request with valid session returns success
    When User Signs In With Microsoft SSO As "user1"
    Then User Verify The Page URL Contains "/applications-list"
    Then User Verify The "appreg.sid" Cookie Should Exist
    Then User Verify The Session Is Valid
    When User Makes GET API Request To "/sso/me"
    Then User Verify API Request Returns Status Code "200"

  @regression @ARCPOC-425
  Scenario: API request without session returns unauthorized  
    Given User Is On The Portal Page
    When User Makes GET API Request To "/sso/me"
    Then User Verify API Request Returns Status Code "401"
