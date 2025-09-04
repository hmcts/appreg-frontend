Feature: Authentication and Authorisation
  As a user
  I want to authenticate and authorise using Microsoft SSO
  So that I can access the application securely
  
@smoke @regression @ARCPOC-426
Scenario: Successful Login and Invalid or expired token
  Given User Is On The Portal Page
  Then User Verify The Page URL Contains "/login"
  Then User Signs In With Microsoft SSO As "default"
  Then User Verify The Page URL Contains "/applications-list"
  Then User Verify The "appreg.sid" Cookie Should Exist
  When User Clears Cookies And Storage
  When User Refreshes The Page
  Then User Verify The Page URL Contains "/login"
  
@smoke @regression @ARCPOC-426
  Scenario: Redirect on unauthenticated access
    Given User Navigates To The URL "/applications-list"
    Then User Verify The Page URL Contains "/login"
    Then User Clicks On The " Sign in with your Justice SSO account " Button
    Then User Should Not See The Element "app-login"

@smoke @regression @ARCPOC-426
  Scenario: Sign out
    Given User Is On The Portal Page
    Then User Verify The Page URL Contains "/login"
    Then User Signs In With Microsoft SSO As "default"
    Then User Verify The Page URL Contains "/applications-list"
    Then User Clicks On The Link "Sign out"
    Then User Verify The Page URL Contains "/login"
    Then User Verify The "appreg.sid" Cookie Should Not Exist
