Feature: Application List Row Actions

    @regression @ARCPOC-214 @ARCPOC-453 @ARCPOC-799 @ARCPOC-802 @ARCPOC-449
    Scenario Outline: Verify PDF download for 0 entries
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | status   | description   | courtLocationCode   |
            | <DisplayDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link "Applications list"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Enters "<Description>" Into The "Description" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Rows
        # Click Print continuous to download PDF
        When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User Sees Notification Banner "There is a problem No entries available to print"
        Then User Clears The "Description" Textbox
        Then User Enters "past" Into The "Description" Textbox
        When User Clicks On The "Search" Button
        Then User Sees Notification Banner "Important No lists found Try different filters, or create a new list"
        Examples:
            | User  | TableName | SearchDate | DisplayDate | Time           | courtLocationCode | Court                             | Description                              | Entries | Status | SelectButtonText | ButtonName       |
            | user1 | Lists     | today      | todayiso    | timenowhhmm-2h | RCJ001            | Royal Courts of Justice Set 1     | Test_{RANDOM} for Applications to review | 0       | OPEN   | Select           | Print continuous |
            | user1 | Lists     | today      | todayiso    | timenowhhmm-2h | LCCC025           | Leeds Combined Court Centre Set 3 | Test_{RANDOM} for Leeds applications     | 0       | OPEN   | Select           | Print page       |

    @regression @ARCPOC-214 @ARCPOC-453 @ARCPOC-449 @ARCPOC-803
    Scenario Outline: Verify PDF download for print continuous and print page with entries for Court
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | status   | description   | durationHours   | durationMinutes   | courtLocationCode   |
            | <DisplayDate> | <Time> | <Status> | <Description> | <durationHours> | <durationMinutes> | <courtLocationCode> |
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
                            "title": "Mr",
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
                "caseReference": "CASE-{RANDOM}",
                "accountNumber": "ACC-{RANDOM}",
                "notes": "Application discussion ref {RANDOM}",
                "lodgementDate": "todayiso",
                "officials": [
                    {
                        "title": "Mr",
                        "surname": "Smith {RANDOM}",
                        "forename": "John",
                        "type": "MAGISTRATE"
                    }
                ]
            }
            """
        Then User Verify Response Status Code Should Be "201"
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link "Applications list"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Enters "<Description>" Into The "Description" Textbox
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks "<SelectButtonText>" Then "Print continuous" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        # Verify PDF was downloaded and contains expected content
        Then User Verifies PDF "<PDFNameContinuous>" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Has <Pages> Pages
        Then User Verifies Latest Downloaded PDF Contains Text "Check List Report"
        Then User Verifies Latest Downloaded PDF Contains <Entries> "Applicant" Entries
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Date & Time            | <DisplayDate> <Time>                                                                                                                      |
            | Duration               | <durationHours> Hours <durationMinutes> Minutes                                                                                           |
            | Location               | <Court>                                                                                                                                   |
            | Applicant              | Mr Henry James Taylor {RANDOM}                                                                                                            |
            | Respondent             | Ms Emily Rose Clark {RANDOM}                                                                                                              |
            | Case Reference         | CASE-{RANDOM}                                                                                                                             |
            | Application Code       | CT99002                                                                                                                                   |
            | Account Reference      | ACC-{RANDOM}                                                                                                                              |
            | Application Title      | Issue of liability order summons - council tax                                                                                            |
            | Result                 | -                                                                                                                                         |
            | Notes                  | Case noted with ref {RANDOM}                                                                                                              |
            | This matter was before | Mr Turner {RANDOM} Graham MAGISTRATE Ms Hayes {RANDOM} Laura MAGISTRATE Mr Miller {RANDOM} Peter CLERK Ms Patel {RANDOM} Anita MAGISTRATE |
            | Applicant              | Mr John A B Smith {RANDOM}                                                                                                                |
            | Respondent             | -                                                                                                                                         |
            | Case Reference         | CASE-{RANDOM}                                                                                                                             |
            | Application Code       | AD99002                                                                                                                                   |
            | Account Reference      | ACC-{RANDOM}                                                                                                                              |
            | Application Title      | Copy documents (electronic)                                                                                                               |
            | Result                 | -                                                                                                                                         |
            | Notes                  | Application discussion ref {RANDOM}                                                                                                       |
            | This matter was before | Mr Smith {RANDOM} John MAGISTRATE                                                                                                         |
        Then User Clears Downloaded PDFs
        When User Clicks "<SelectButtonText>" Then "Print page" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        # Verify PDF was downloaded and contains expected content
        Then User Verifies PDF "<PDFNamePage>" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Has <Pages> Pages
        Then User Verifies Latest Downloaded PDF Contains Text "<Court>"
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Application brought by | Mr Henry James Taylor {RANDOM}                                                                                                                                                            |
            | Respondent             | Ms Emily Rose Clark {RANDOM}                                                                                                                                                              |
            | Matter considered      | Issue of liability order summons - council tax                                                                                                                                            |
            | CT99002                | Attends to swear a complaint for the issue of a summons for the debtor to answer an application for a liability order in relation to unpaid council tax (reference test wording {RANDOM}) |
            | This matter was before | Mr Turner {RANDOM} Graham MAGISTRATE Ms Hayes {RANDOM} Laura MAGISTRATE Mr Miller {RANDOM} Peter CLERK Ms Patel {RANDOM} Anita MAGISTRATE                                                 |
            | Dated                  | <DisplayDate>                                                                                                                                                                             |
            | Produced on            | <SearchDate>                                                                                                                                                                              |
            | Application brought by | Mr John A B Smith {RANDOM}                                                                                                                                                                |
            | Respondent             | -                                                                                                                                                                                         |
            | Matter considered      | Copy documents (electronic)                                                                                                                                                               |
            | AD99002                | Request for copy documents on computer disc or in electronic form                                                                                                                         |
            | This matter was before | Mr Smith {RANDOM} John MAGISTRATE                                                                                                                                                         |
            | Dated                  | <DisplayDate>                                                                                                                                                                             |
            | Produced on            | <SearchDate>                                                                                                                                                                              |
        Then User Clears Downloaded PDFs
        Examples:
            | User  | TableName | SearchDate | DisplayDate | Time           | courtLocationCode | Court                             | Description                             | durationHours | durationMinutes | Entries | Status | SelectButtonText | PDFNameContinuous                                     | PDFNamePage                                           | Pages |
            | user1 | Lists     | today      | todayiso    | timenowhhmm-2h | LCCC025           | Leeds Combined Court Centre Set 3 | Applications to review at Test_{RANDOM} | 2             | 22              | 2       | OPEN   | Select           | leeds-combined-court-centre-set-3-todayiso-print-cont | leeds-combined-court-centre-set-3-todayiso-print-page | 2     |

    @regression @ARCPOC-214 @ARCPOC-453 @ARCPOC-449
    Scenario Outline: Verify PDF download for print page with entries for CJA
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | status   | description   | cjaCode   | otherLocationDescription   |
            | <DisplayDate> | <Time> | <Status> | <Description> | <cjaCode> | <otherLocationDescription> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Json Body
            """
            {
                "standardApplicantCode": "APP032",
                "applicationCode": "AD99003",
                "numberOfRespondents": null,
                "wordingFields": [],
                "feeStatuses": [
                    {
                        "paymentReference": "PAY-{RANDOM}",
                        "paymentStatus": "PAID",
                        "statusDate": "todayiso-2d"
                    }
                ],
                "hasOffsiteFee": false,
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
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link "Applications list"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<cjaCode>"
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks "<SelectButtonText>" Then "Print continuous" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location     | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <OptionText> | <Description> | <Entries> | <Status> |
        Then User Verifies PDF "<PDFNameContinuous>" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Has <Pages> Pages
        Then User Verifies Latest Downloaded PDF Contains Text "Check List Report"
        Then User Verifies Latest Downloaded PDF Contains <Entries> "Applicant" Entries
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Date & Time            | <DisplayDate> <Time>                                                                                                                      |
            | Duration               | -                                                                                                                                         |
            | Location               | <otherLocationDescription> A8 - CJA Number 308                                                                                            |
            | Applicant              | Sunrise Manufacturing Co 456 Industrial Estate, B1 2CD Email: info@example.com                                                            |
            | Respondent             | -                                                                                                                                         |
            | Case Reference         | CASE-{RANDOM}                                                                                                                             |
            | Application Code       | AD99003                                                                                                                                   |
            | Account Reference      | ACC-{RANDOM}                                                                                                                              |
            | Application Title      | Extract from the Court Register                                                                                                           |
            | Result                 | -                                                                                                                                         |
            | Notes                  | Case noted with ref {RANDOM}                                                                                                              |
            | This matter was before | Mr Turner {RANDOM} Graham MAGISTRATE Ms Hayes {RANDOM} Laura MAGISTRATE Mr Miller {RANDOM} Peter CLERK Ms Patel {RANDOM} Anita MAGISTRATE |
        Then User Clears Downloaded PDFs
        When User Clicks "<SelectButtonText>" Then "Print page" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location     | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <OptionText> | <Description> | <Entries> | <Status> |
        # Verify PDF was downloaded and contains expected content
        Then User Verifies PDF "<PDFNamePage>" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Has <Pages> Pages
        Then User Verifies Latest Downloaded PDF Contains Text "<otherLocationDescription>"
        Then User Verifies Latest Downloaded PDF Contains Text "<cjaCode> - <OptionText>"
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Application brought by | Sunrise Manufacturing Co 456 Industrial Estate, B1 2CD Email: info@example.com Phone: 01234567891                                         |
            | Respondent             | -                                                                                                                                         |
            | Matter considered      | Extract from the Court Register                                                                                                           |
            | AD99003                | Certified extract from the court register                                                                                                 |
            | This matter was before | Mr Turner {RANDOM} Graham MAGISTRATE Ms Hayes {RANDOM} Laura MAGISTRATE Mr Miller {RANDOM} Peter CLERK Ms Patel {RANDOM} Anita MAGISTRATE |
            | Dated                  | <DisplayDate>                                                                                                                             |
            | Produced on            | <SearchDate>                                                                                                                              |
        Examples:
            | User  | TableName | SearchDate | DisplayDate | Time           | cjaCode | OptionText     | otherLocationDescription                | Description               | Entries | Status | SelectButtonText | PDFNameContinuous                  | PDFNamePage                        | Pages |
            | user1 | Lists     | today      | todayiso    | timenowhhmm-1h | A8      | CJA Number 308 | This is a location description {RANDOM} | ENFORCEMENT LIST-{RANDOM} | 1       | OPEN   | Select           | cja-number-308-todayiso-print-cont | cja-number-308-todayiso-print-page | 1     |


    @regression @ARCPOC-214 @ARCPOC-453 @ARCPOC-449 @ARCPOC-803
    Scenario Outline: Verify PDF download for print continuous and print page with entries for Court and Status Closed
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | status | description   | durationHours   | durationMinutes   | courtLocationCode   |
            | <DisplayDate> | <Time> | OPEN   | <Description> | <durationHours> | <durationMinutes> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Json Body
            """
            {
                "standardApplicantCode": null,
                "applicationCode": "MS99006",
                "applicant": {
                    "person": null,
                    "organisation": {
                        "name": "ACME Industries LTD",
                        "contactDetails": {
                            "addressLine1": "{RANDOM} Downing Street",
                            "addressLine2": "Westminster",
                            "addressLine3": "London",
                            "addressLine4": "Greater London",
                            "addressLine5": "United Kingdom",
                            "postcode": "SW1A 2AA",
                            "phone": "01225 123456",
                            "mobile": "07123456789",
                            "email": "john-test@gmail.com"
                        }
                    }
                },
                "respondent": {
                    "person": null,
                    "organisation": {
                        "name": "Beta Solutions Inc",
                        "contactDetails": {
                            "addressLine1": "{RANDOM} Fleet Street",
                            "addressLine2": "London",
                            "addressLine3": "",
                            "addressLine4": "",
                            "addressLine5": "United Kingdom",
                            "postcode": "EC4Y 1AA",
                            "phone": "01132 654321",
                            "mobile": "07987654321",
                            "email": "betasolutions@gmail.com"
                        }
                    }
                },
                "numberOfRespondents": null,
                "wordingFields": [
                    "test food {RANDOM}"
                ],
                "feeStatuses": [],
                "hasOffsiteFee": true,
                "caseReference": "CASE-{RANDOM}",
                "accountNumber": "ACC-{RANDOM}",
                "notes": "Case noted with ref {RANDOM}",
                "lodgementDate": "todayiso",
                "officials": [
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
        When User Makes PUT API Request To "/application-lists/:listId" With Body:
            | date          | time   | status   | description   | durationHours   | durationMinutes   | courtLocationCode   |
            | <DisplayDate> | <Time> | <Status> | <Description> | <durationHours> | <durationMinutes> | <courtLocationCode> |
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link "Applications list"
        When User Set Date Field "Date" To "<SearchDate>"
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks "<SelectButtonText>" Then "Print continuous" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        # Verify PDF was downloaded and contains expected content
        Then User Verifies PDF "<PDFNameContinuous>" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Has <Pages> Pages
        Then User Verifies Latest Downloaded PDF Contains Text "Applications Register Report"
        Then User Verifies Latest Downloaded PDF Contains <Entries> "Applicant" Entries
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Date & Time            | <DisplayDate> <Time>                                              |
            | Duration               | <durationMinutes> Minutes                                         |
            | Location               | <Court>                                                           |
            | Applicant              | ACME Industries LTD {RANDOM} Downing Street, Westminster, London, |
            | Respondent             | Beta Solutions Inc {RANDOM} Fleet Street, London, EC4Y 1AA        |
            | Case Reference         | CASE-{RANDOM}                                                     |
            | Application Code       | MS99006                                                           |
            | Account Reference      | ACC-{RANDOM}                                                      |
            | Application Title      | Condemnation of Unfit Food                                        |
            | Result                 | -                                                                 |
            | Notes                  | Case noted with ref {RANDOM}                                      |
            | This matter was before | Ms Patel {RANDOM} Anita MAGISTRATE                                |
        Then User Clears Downloaded PDFs
        When User Clicks "<SelectButtonText>" Then "Print page" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        # Verify PDF was downloaded and contains expected content
        Then User Verifies PDF "<PDFNamePage>" Is Downloaded
        Then User Verifies Latest Downloaded PDF Is Not Empty
        Then User Verifies Latest Downloaded PDF Has <Pages> Pages
        Then User Verifies Latest Downloaded PDF Contains Text "<Court>"
        Then User Verifies Latest Downloaded PDF Contains The Following Values:
            | Application brought by | ACME Industries LTD {RANDOM} Downing Street, Westminster, London, SW1A 2AA Email: john-test@gmail.com Phone: 01225 123456 Mobile: 07123456789 ACC-{RANDOM} |
            | Respondent             | Beta Solutions Inc {RANDOM} Fleet Street, London, EC4Y 1AA Email: betasolutions@gmail.com Phone: 01132 654321 Mobile: 07987654321                          |
            | Matter considered      | Condemnation of Unfit Food                                                                                                                                 |
            | MS99006                | Application for the condemnation of food, namely test food {RANDOM}                                                                                        |
            | This matter was before | Ms Patel {RANDOM} Anita MAGISTRATE                                                                                                                         |
            | Dated                  | <DisplayDate>                                                                                                                                              |
            | Produced on            | <SearchDate>                                                                                                                                               |
        Then User Clears Downloaded PDFs
        Examples:
            | User  | TableName | SearchDate | DisplayDate | Time           | courtLocationCode | Court                             | Description                             | durationHours | durationMinutes | Entries | Status | SelectButtonText | PDFNameContinuous                                     | PDFNamePage                                           | Pages |
            | user1 | Lists     | today      | todayiso    | timenowhhmm-2h | LCCC025           | Leeds Combined Court Centre Set 3 | Applications to review at Test_{RANDOM} | 0             | 5               | 1       | CLOSED | Select           | leeds-combined-court-centre-set-3-todayiso-print-cont | leeds-combined-court-centre-set-3-todayiso-print-page | 1     |

    @regression @ARCPOC-214 @ARCPOC-575
    Scenario Outline: Verify application list is deleted successfully for applications list NO entries
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | status   | description   | courtLocationCode   |
            | <DisplayDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link "Applications list"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Enters "<Description>" Into The "Description" Textbox
        When User Clicks On The "Search" Button
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks "<SelectButtonText>" Then "Delete" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | 0       | <Status> |
        # When User Confirms The Deletion
        Then User Sees Notification Banner "Success Application List deleted successfully If you believe this was in error, please contact support."
        Then User Clears The "Description" Textbox
        When User Set Date Field "Date" To "<SearchDate>"
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should Not See Row In Table "<TableName>" With Values:
            | Date          | Time   | Location | Description   | Entries | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | 0       | <Status> |
        Examples:
            | User  | TableName | SearchDate | DisplayDate | Time           | courtLocationCode | Court                             | Description                             | Status | SelectButtonText |
            | user1 | Lists     | today      | todayiso    | timenowhhmm-3h | LCCC025           | Leeds Combined Court Centre Set 3 | Applications to review at Test_{RANDOM} | OPEN   | Select           |

    @regression @ARCPOC-214 @ARCPOC-575 @PJ
    Scenario Outline: Verify application list is deleted successfully for applications list 1 entry
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date          | time   | status   | description   | courtLocationCode   |
            | <DisplayDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Json Body
            """
            {
                "standardApplicantCode": null,
                "applicationCode": "MS99006",
                "applicant": {
                    "person": null,
                    "organisation": {
                        "name": "Demo Manufacturing LTD",
                        "contactDetails": {
                            "addressLine1": "{RANDOM} Downing Street",
                            "addressLine2": "Westminster",
                            "addressLine3": "London",
                            "addressLine4": "Greater London",
                            "addressLine5": "United Kingdom",
                            "postcode": "SW1A 2AA",
                            "phone": "01225 123456",
                            "mobile": "07123456789",
                            "email": "john-test@gmail.com"
                        }
                    }
                },
                "respondent": {
                    "person": null,
                    "organisation": {
                        "name": "Sample Services Inc",
                        "contactDetails": {
                            "addressLine1": "{RANDOM} Fleet Street",
                            "addressLine2": "London",
                            "addressLine3": "",
                            "addressLine4": "",
                            "addressLine5": "United Kingdom",
                            "postcode": "EC4Y 1AA",
                            "phone": "01132 654321",
                            "mobile": "07987654321",
                            "email": "sampleservices@gmail.com"
                        }
                    }
                },
                "numberOfRespondents": null,
                "wordingFields": [
                    "test food {RANDOM}"
                ],
                "feeStatuses": [],
                "hasOffsiteFee": true,
                "caseReference": "CASE-{RANDOM}",
                "accountNumber": "ACC-{RANDOM}",
                "notes": "Case noted with ref {RANDOM}",
                "lodgementDate": "todayiso",
                "officials": [
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
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        Then User Clicks On The Link "Applications list"
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Selects "<Court>" From The Textbox "Court" Autocomplete By Typing "<courtLocationCode>"
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should See Table "<TableName>" Has Rows
        When User Clicks "<SelectButtonText>" Then "Delete" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | 1       | <Status> |
        # When User Confirms The Deletion
        Then User Sees Notification Banner "Success Application List deleted successfully If you believe this was in error, please contact support."
        When User Set Date Field "Date" To "<SearchDate>"
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should Not See Row In Table "<TableName>" With Values:
            | Date          | Time   | Location | Description   | Entries | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | 1       | <Status> |
        Examples:
            | User  | TableName | SearchDate | DisplayDate | Time           | courtLocationCode | Court                             | Description                             | Status | SelectButtonText |
            | user1 | Lists     | today      | todayiso    | timenowhhmm-3h | LCCC025           | Leeds Combined Court Centre Set 3 | Applications to review at Test_{RANDOM} | OPEN   | Select           |
