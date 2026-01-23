Feature: Application List Entry

    @api @regression @ARCPOC-229
    Scenario Outline: Create Application List Entry
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                             | durationHours | durationMinutes | otherLocationDescription         | cjaCode |
            | todayiso | timenowhhmm-2h | OPEN   | Applications to review at Test_{RANDOM} | 2             | 22              | Temporary Courtroom at Town Hall | 01      |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Json Body
            """
            {
                "standardApplicantCode": null,
                "applicationCode": "AD99002",
                "applicant": {
                    "person": {
                        "name": {
                            "title": "Mr, Mrs",
                            "surname": "Smith{RANDOM}",
                            "firstForename": "John",
                            "secondForename": "A",
                            "thirdForename": "B"
                        },
                        "contactDetails": {
                            "addressLine1": "{RANDOM} High Street",
                            "addressLine2": "Westminster",
                            "addressLine3": "London",
                            "addressLine4": "Greater London",
                            "addressLine5": "United Kingdom",
                            "postcode": "SW1A 2AA",
                            "phone": "0207{RANDOM}",
                            "mobile": "07123{RANDOM}",
                            "email": "john.smith{RANDOM}@example.com"
                        }
                    }
                },
                "wordingFields": [],
                "feeStatuses": [
                    {
                        "paymentReference": "PAY-{RANDOM}",
                        "paymentStatus": "PAID",
                        "statusDate": "todayiso+1d"
                    }
                ],
                "hasOffsiteFee": false,
                "caseReference": "CASE-001",
                "accountNumber": "APP-{RANDOM}",
                "notes": "Application discussion ref {RANDOM}",
                "lodgementDate": "todayiso",
                "officials": [
                    {
                        "title": "Mr, Mrs",
                        "surname": "Smith{RANDOM}",
                        "forename": "John",
                        "type": "MAGISTRATE"
                    }
                ]
            }
            """
        Then User Verify Response Status Code Should Be "201"
        Examples:
            | User  |
            | user1 |


    @api @regression @ARCPOC-229
    Scenario Outline: Create Application List Entry
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                             | durationHours | durationMinutes | courtLocationCode |
            | todayiso | timenowhhmm-2h | OPEN   | Applications to review at Test_{RANDOM} | 2             | 22              | LCCC065           |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Json Body
            """
            {
                "standardApplicantCode": null,
                "applicationCode": "CT99002",
                "applicant": {
                    "person": {
                        "name": {
                            "title": "Mr",
                            "surname": "Taylor {RANDOM}",
                            "firstForename": "Henry",
                            "secondForename": "James",
                            "thirdForename": ""
                        },
                        "contactDetails": {
                            "addressLine1": "{RANDOM} King Street",
                            "addressLine2": "Westminster",
                            "addressLine3": "London",
                            "addressLine4": "Greater London",
                            "addressLine5": "United Kingdom",
                            "postcode": "SW1A 1AA",
                            "phone": "0203{RANDOM}",
                            "mobile": "07123{RANDOM}",
                            "email": "applicant{RANDOM}@example.com"
                        }
                    },
                    "organisation": null
                },
                "respondent": {
                    "person": {
                        "name": {
                            "title": "Ms",
                            "surname": "Clark {RANDOM}",
                            "firstForename": "Emily",
                            "secondForename": "Rose",
                            "thirdForename": ""
                        },
                        "contactDetails": {
                            "addressLine1": "{RANDOM} Market Road",
                            "addressLine2": "Bristol",
                            "addressLine3": "Avon",
                            "addressLine4": "United Kingdom",
                            "addressLine5": "",
                            "postcode": "BS1 5AA",
                            "phone": "0117{RANDOM}",
                            "mobile": "07984{RANDOM}",
                            "email": "respondent{RANDOM}@example.com"
                        }
                    },
                    "dateOfBirth": "todayiso-25y",
                    "organisation": null
                },
                "numberOfRespondents": null,
                "wordingFields": [
                    "test wording {RANDOM}"
                ],
                "feeStatuses": [],
                "hasOffsiteFee": true,
                "caseReference": "CASE-{RANDOM}",
                "accountNumber": "ACC-{RANDOM}",
                "notes": "Case noted with ref {RANDOM}",
                "lodgementDate": "todayiso",
                "officials": [
                    {
                        "title": "Mr",
                        "surname": "Turner {RANDOM}",
                        "forename": "Graham",
                        "type": "MAGISTRATE"
                    },
                    {
                        "title": "Ms",
                        "surname": "Hayes {RANDOM}",
                        "forename": "Laura",
                        "type": "MAGISTRATE"
                    },
                    {
                        "title": "Mr",
                        "surname": "Miller {RANDOM}",
                        "forename": "Peter",
                        "type": "CLERK"
                    },
                    {
                        "title": "Ms",
                        "surname": "Patel {RANDOM}",
                        "forename": "Anita",
                        "type": "MAGISTRATE"
                    }
                ]
            }
            """
        Then User Verify Response Status Code Should Be "201"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Json Body
            """
            {
                "standardApplicantCode": null,
                "applicationCode": "AD99002",
                "applicant": {
                    "person": {
                        "name": {
                            "title": "Mr, Mrs",
                            "surname": "Smith {RANDOM}",
                            "firstForename": "John",
                            "secondForename": "A",
                            "thirdForename": "B"
                        },
                        "contactDetails": {
                            "addressLine1": "{RANDOM} High Street",
                            "addressLine2": "Westminster",
                            "addressLine3": "London",
                            "addressLine4": "Greater London",
                            "addressLine5": "United Kingdom",
                            "postcode": "SW1A 2AA",
                            "phone": "0207{RANDOM}",
                            "mobile": "07123{RANDOM}",
                            "email": "john.smith{RANDOM}@example.com"
                        }
                    }
                },
                "wordingFields": [],
                "feeStatuses": [
                    {
                        "paymentReference": "PAY-{RANDOM}",
                        "paymentStatus": "PAID",
                        "statusDate": "todayiso+1d"
                    }
                ],
                "hasOffsiteFee": false,
                "caseReference": "CASE-001",
                "accountNumber": "APP-{RANDOM}",
                "notes": "Application discussion ref {RANDOM}",
                "lodgementDate": "todayiso",
                "officials": [
                    {
                        "title": "Mr, Mrs",
                        "surname": "Smith{RANDOM}",
                        "forename": "John",
                        "type": "MAGISTRATE"
                    }
                ]
            }
            """
        Then User Verify Response Status Code Should Be "201"
        Examples:
            | User  |
            | user1 |
