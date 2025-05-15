Feature: Address Validation

  Scenario: Send eRx and assign it to customer and validate address mark as preferred, should be editable and last address should not be deleted
    Given I open the website
    When I enter Email, Password of "admin"
    And I enter location as "New York"
    And I click on "customer" icon
    And I click on customer tab
    And I click on close icon
    And I wait for 3 sec
    And I check status of "Save" button to be "enabled"
    And I search for patient from top searchbar ""
    And I verify "success" toast message from json "toastMessages.json"
    And I change pharmacy location to "Los Angeles"
    And I trigger "Refill" job
    And I fill delivery date change reason
    And I trigger refill candidate job
    And I click on span button "Add Address"
    And I validate Rx number not available in queue
    And I add ndc via API

  Scenario: Send eRx and add customer and validate address should be editable
    Given I open the website
    When I enter Email, Password of "admin"
    And I enter location as "Los Angeles"
    And I click on "customer" icon
    And I click on customer tab
    And I click on close icon
    And I wait for 3 sec
    And I check status of "Save" button to be "enabled"
    And I search for patient from top searchbar ""
    And I verify "success" toast message from json "toastMessages.json"
    And I change pharmacy location to "New York"
    And I trigger "Refill" job
    And I fill delivery date change reason
    And I trigger refill candidate job
    And I click on span button "Add Address"
    And I validate Rx number not available in queue
    And I add ndc via API
