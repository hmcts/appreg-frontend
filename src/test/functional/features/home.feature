Feature: Home page
  As a user
  I want to view the home page
  So that I can see the default page template

  Scenario: Load home page
    Given the app is running at "<BASE_URL>"
    When I visit the "/" route
    Then I should see the "Default page template" heading
    And I should see the "#main-content" element
    And I should see the header and footer components
