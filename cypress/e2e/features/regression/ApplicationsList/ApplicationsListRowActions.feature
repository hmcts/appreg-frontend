Feature: Application List Row Actions

    @regression @applicationsList @ARCPOC-214 @ARCPOC-453 @ARCPOC-799 @ARCPOC-802 @ARCPOC-449
    Scenario Outline: Verify PDF download for 0 entries
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status   | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       | <Status> |                |     |           |
        # Click Print continuous to download PDF
        When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User Sees Validation Error Banner "There is a problem No entries available to print"
        Then User Clears The "List description" Textbox
        Then User Enters "past" Into The "List description" Textbox
        When User Clicks On The "Search" Button
        Then User Sees Notification Banner "Important No lists found Try different filters, or create a new list"
        # Application List Cleanup
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "204"
        Examples:
            | User  | TableName | SearchDate | APIDate  | DisplayDate  | Time           | courtLocationCode | Court                             | Description                              | Entries | Status | SelectButtonText | ButtonName       |
            | user1 | Lists     | today      | todayiso | todaydisplay | timenowhhmm-2h | RCJ001            | Royal Courts of Justice Set 1     | Test_{SCENARIO_ID} for Applications to review | 0       | OPEN   | Select           | Print continuous |
            | user1 | Lists     | today      | todayiso | todaydisplay | timenowhhmm-2h | LCCC025           | Leeds Combined Court Centre Set 3 | Test_{SCENARIO_ID} for Leeds applications     | 0       | OPEN   | Select           | Print page       |

    @regression @applicationsList @ARCPOC-214 @ARCPOC-453 @ARCPOC-449 @ARCPOC-803 @ARCPOC-1371
    Scenario Outline: Verify PDF download for print continuous and print page with entries for Court
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | durationHours   | durationMinutes   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <durationHours> | <durationMinutes> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Json Body
            """
            {
                "standardApplicantCode": null,
                "applicationCode": "AP99001",
                "applicant": {
                    "person": {
                        "name": {
                            "title": "Mr",
                            "firstName": "Henry",
                            "middleName": "James",
                            "lastName": "Taylor {SCENARIO_ID}"
                        },
                        "contactDetails": {
                            "addressLine1": "{SCENARIO_ID} King Street",
                            "addressLine2": "Westminster",
                            "addressLine3": "London",
                            "addressLine4": "Greater London",
                            "addressLine5": "United Kingdom",
                            "postcode": "SW1A 1AA",
                            "phone": "0203{RANDOM}",
                            "mobile": "07123{RANDOM}",
                            "email": "applicant{SCENARIO_ID}@example.com"
                        }
                    },
                    "organisation": null
                },
                "respondent": {
                    "person": {
                        "name": {
                            "title": "Ms",
                            "firstName": "Emily",
                            "middleName": "Rose",
                            "lastName": "Clark {SCENARIO_ID}"
                        },
                        "contactDetails": {
                            "addressLine1": "{SCENARIO_ID} Market Road",
                            "addressLine2": "Bristol",
                            "addressLine3": "Avon",
                            "addressLine4": "United Kingdom",
                            "addressLine5": null,
                            "postcode": "BS15 5AA",
                            "phone": "0117{RANDOM}",
                            "mobile": "07984{RANDOM}",
                            "email": "respondent{SCENARIO_ID}@example.com"
                        },
                        "dateOfBirth": "todayiso-25y"
                    },
                    "organisation": null
                },
                "numberOfRespondents": null,
                "wordingFields": [
                    {
                        "key": "Date of Hearing",
                        "value": "{SCENARIO_ID}"
                    }
                ],
                "feeStatuses": [],
                "hasOffsiteFee": true,
                "caseReference": "CASE-{RANDOM}",
                "accountNumber": "ACC-{RANDOM}",
                "notes": "Case noted with ref {SCENARIO_ID}",
                "lodgementDate": "todayiso",
                "officials": [
                    {
                        "title": "Mr",
                        "surname": "Turner {SCENARIO_ID}",
                        "forename": "Graham",
                        "type": "MAGISTRATE"
                    },
                    {
                        "title": "Ms",
                        "surname": "Hayes {SCENARIO_ID}",
                        "forename": "Laura",
                        "type": "MAGISTRATE"
                    },
                    {
                        "title": "Mr",
                        "surname": "Miller {SCENARIO_ID}",
                        "forename": "Peter",
                        "type": "CLERK"
                    },
                    {
                        "title": "Ms",
                        "surname": "Patel {SCENARIO_ID}",
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
                            "firstName": "John",
                            "middleName": "A B",
                            "lastName": "Smith {SCENARIO_ID}"
                        },
                        "contactDetails": {
                            "addressLine1": "{SCENARIO_ID} High Street",
                            "addressLine2": "Westminster",
                            "addressLine3": "London",
                            "addressLine4": "Greater London",
                            "addressLine5": "United Kingdom",
                            "postcode": "SW1A 2AA",
                            "phone": "0207{RANDOM}",
                            "mobile": "07123{RANDOM}",
                            "email": "john.smith{SCENARIO_ID}@example.com"
                        }
                    }
                },
                "wordingFields": [],
                "feeStatuses": [
                    {
                        "paymentReference": "PAY-{RANDOM}",
                        "paymentStatus": "PAID",
                        "statusDate": "todayiso"
                    }
                ],
                "hasOffsiteFee": false,
                "caseReference": "CASE-{RANDOM}",
                "accountNumber": "ACC-{RANDOM}",
                "notes": "Application discussion ref {SCENARIO_ID}",
                "lodgementDate": "todayiso",
                "officials": [
                    {
                        "title": "Mr",
                        "surname": "Smith {SCENARIO_ID}",
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
        When User Searches Application List With:
            | Date         | Time | Description   | CourtSearch | Court | Status | Other location | CJA | CJASearch |
            | <SearchDate> |      | <Description> |             |       |        |                |     |           |
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
            | Applicant              | Mr Henry James Taylor {SCENARIO_ID}                                                                                                            |
            | Respondent             | Ms Emily Rose Clark {SCENARIO_ID}                                                                                                              |
            | Case Reference         | CASE-{RANDOM}                                                                                                                             |
            | Application Code       | AP99001                                                                                                                                   |
            | Account Reference      | ACC-{RANDOM}                                                                                                                              |
            | Application Title      | Appeal to Crown Court                                                                                                                     |
            | Result                 | -                                                                                                                                         |
            | Notes                  | Case noted with ref {SCENARIO_ID}                                                                                                              |
            | This matter was before | Mr Turner {SCENARIO_ID} Graham MAGISTRATE Ms Hayes {SCENARIO_ID} Laura MAGISTRATE Mr Miller {SCENARIO_ID} Peter CLERK Ms Patel {SCENARIO_ID} Anita MAGISTRATE |
            | Applicant              | Mr John A B Smith {SCENARIO_ID}                                                                                                                |
            | Respondent             | -                                                                                                                                         |
            | Case Reference         | CASE-{RANDOM}                                                                                                                             |
            | Application Code       | AD99002                                                                                                                                   |
            | Account Reference      | ACC-{RANDOM}                                                                                                                              |
            | Application Title      | Copy documents (electronic)                                                                                                               |
            | Result                 | -                                                                                                                                         |
            | Notes                  | Application discussion ref {SCENARIO_ID}                                                                                                       |
            | This matter was before | Mr Smith {SCENARIO_ID} John MAGISTRATE                                                                                                         |
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
            | Application brought by | Mr Henry James Taylor {SCENARIO_ID}                                                                                                            |
            | Respondent             | Ms Emily Rose Clark {SCENARIO_ID}                                                                                                              |
            | Matter considered      | Appeal to Crown Court                                                                                                                     |
            | This matter was before | Mr Turner {SCENARIO_ID} Graham MAGISTRATE Ms Hayes {SCENARIO_ID} Laura MAGISTRATE Mr Miller {SCENARIO_ID} Peter CLERK Ms Patel {SCENARIO_ID} Anita MAGISTRATE |
            | Dated                  | <DisplayDateLong>                                                                                                                         |
            | Produced on            | <SearchDate>                                                                                                                              |
            | Application brought by | Mr John A B Smith {SCENARIO_ID}                                                                                                                |
            | Respondent             | -                                                                                                                                         |
            | Matter considered      | Copy documents (electronic)                                                                                                               |
            | AD99002                | Request for copy documents on computer disc or in electronic form                                                                         |
            | This matter was before | Mr Smith {SCENARIO_ID} John MAGISTRATE                                                                                                         |
            | Dated                  | <DisplayDateLong>                                                                                                                         |
            | Produced on            | <SearchDate>                                                                                                                              |
        Then User Clears Downloaded PDFs
        Examples:
            | User  | TableName | SearchDate | APIDate  | DisplayDate  | DisplayDateLong  | Time           | courtLocationCode | Court                             | Description                             | durationHours | durationMinutes | Entries | Status | SelectButtonText | PDFNameContinuous                                     | PDFNamePage                                           | Pages |
            | user1 | Lists     | today      | todayiso | todaydisplay | todaydisplaylong | timenowhhmm-2h | LCCC025           | Leeds Combined Court Centre Set 3 | Applications to review at Test_{SCENARIO_ID} | 2             | 22              | 2       | OPEN   | Select           | leeds-combined-court-centre-set-3-todayiso-print-cont | leeds-combined-court-centre-set-3-todayiso-print-page | 2     |

    @regression @applicationsList @ARCPOC-214 @ARCPOC-453 @ARCPOC-449
    Scenario Outline: Verify PDF download for print page with entries for CJA
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | cjaCode   | otherLocationDescription   |
            | <APIDate> | <Time> | <Status> | <Description> | <cjaCode> | <otherLocationDescription> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Json Body
            """
            {
                "standardApplicantCode": "BGAS",
                "applicationCode": "AD99004",
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
                "notes": "Case noted with ref {SCENARIO_ID}",
                "lodgementDate": "todayiso",
                "officials": [
                    {
                        "title": "Mr",
                        "surname": "Turner {SCENARIO_ID}",
                        "forename": "Graham",
                        "type": "MAGISTRATE"
                    },
                    {
                        "title": "Ms",
                        "surname": "Hayes {SCENARIO_ID}",
                        "forename": "Laura",
                        "type": "MAGISTRATE"
                    },
                    {
                        "title": "Mr",
                        "surname": "Miller {SCENARIO_ID}",
                        "forename": "Peter",
                        "type": "CLERK"
                    },
                    {
                        "title": "Ms",
                        "surname": "Patel {SCENARIO_ID}",
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
        When User Searches Application List With:
            | Date         | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
            | <SearchDate> |      |                  |             |       | <Status>           |                            | <OptionText>          | <cjaCode> |
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
            | Location               | <otherLocationDescription> A8 - Derby                                                                                                     |
            | Applicant              | British Gas Trading Limited Millstream, Maidenhead Road, Windsor, SL4 5GD                                                                 |
            | Respondent             | -                                                                                                                                         |
            | Case Reference         | CASE-{RANDOM}                                                                                                                             |
            | Application Code       | AD99004                                                                                                                                   |
            | Account Reference      | ACC-{RANDOM}                                                                                                                              |
            | Result                 | -                                                                                                                                         |
            | Notes                  | Case noted with ref {SCENARIO_ID}                                                                                                              |
            | This matter was before | Mr Turner {SCENARIO_ID} Graham MAGISTRATE Ms Hayes {SCENARIO_ID} Laura MAGISTRATE Mr Miller {SCENARIO_ID} Peter CLERK Ms Patel {SCENARIO_ID} Anita MAGISTRATE |
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
            | Application brought by | British Gas Trading Limited Maidenhead Road, Windsor, SL4 5GD                                                                             |
            | Respondent             | -                                                                                                                                         |
            | This matter was before | Mr Turner {SCENARIO_ID} Graham MAGISTRATE Ms Hayes {SCENARIO_ID} Laura MAGISTRATE Mr Miller {SCENARIO_ID} Peter CLERK Ms Patel {SCENARIO_ID} Anita MAGISTRATE |
            | Dated                  | <DisplayDateLong>                                                                                                                         |
            | Produced on            | <SearchDate>                                                                                                                              |
        Then User Clears Downloaded PDFs
        Examples:
            | User  | TableName | SearchDate | APIDate  | DisplayDate  | DisplayDateLong  | Time           | cjaCode | OptionText | otherLocationDescription                | Description               | Entries | Status | SelectButtonText | PDFNameContinuous         | PDFNamePage               | Pages |
            | user1 | Lists     | today      | todayiso | todaydisplay | todaydisplaylong | timenowhhmm-1h | A8      | Derby      | This is a location description {SCENARIO_ID} | ENFORCEMENT LIST-{SCENARIO_ID} | 1       | OPEN   | Select           | derby-todayiso-print-cont | derby-todayiso-print-page | 1     |


    @regression @applicationsList @ARCPOC-214 @ARCPOC-453 @ARCPOC-449 @ARCPOC-803 @ARCPOC-1717
    Scenario Outline: Verify PDF download for print continuous and print page with entries for Court and Status Closed
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status | description   | durationHours   | durationMinutes   | courtLocationCode   |
            | <APIDate> | <Time> | OPEN   | <Description> | <durationHours> | <durationMinutes> | <courtLocationCode> |
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
                            "addressLine1": "{SCENARIO_ID} Downing Street",
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
                            "addressLine1": "{SCENARIO_ID} Fleet Street",
                            "addressLine2": "London",
                            "addressLine3": null,
                            "addressLine4": null,
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
                    {
                        "key": "Describe Seized Food",
                        "value": "{SCENARIO_ID}"
                    }
                ],
                "feeStatuses": [],
                "hasOffsiteFee": true,
                "caseReference": "CASE-{RANDOM}",
                "accountNumber": "ACC-{RANDOM}",
                "notes": "Case noted with ref {SCENARIO_ID}",
                "lodgementDate": "todayiso",
                "officials": [
                    {
                        "title": "Ms",
                        "surname": "Patel {SCENARIO_ID}",
                        "forename": "Anita",
                        "type": "MAGISTRATE"
                    }
                ]
            }
            """
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "entryId"
        When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Json Body
            """
            {
                "resultCode": "AUTH"
            }
            """
        Then User Verify Response Status Code Should Be "201"
        When User Makes PUT API Request To "/application-lists/:listId" With Body:
            | date      | time   | status   | description   | durationHours   | durationMinutes   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <durationHours> | <durationMinutes> | <courtLocationCode> |
        Given User Has No Downloaded PDFs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | List description | CourtSearch         | Court   | Select list status | Other location description | Criminal justice area | CJASearch |
            | <SearchDate> |      |                  | <courtLocationCode> | <Court> |                    |                            |                       |           |
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
            | Applicant              | ACME Industries LTD {SCENARIO_ID} Downing Street, Westminster, London, |
            | Respondent             | Beta Solutions Inc {SCENARIO_ID} Fleet Street, London, EC4Y 1AA        |
            | Case Reference         | CASE-{RANDOM}                                                     |
            | Application Code       | MS99006                                                           |
            | Account Reference      | ACC-{RANDOM}                                                      |
            | Application Title      | Condemnation of Unfit Food                                        |
            | Result                 | Authorised                                                        |
            | Notes                  | Case noted with ref {SCENARIO_ID}                                      |
            | This matter was before | Ms Patel {SCENARIO_ID} Anita MAGISTRATE                                |
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
            | This matter was before | Ms Patel {SCENARIO_ID} Anita MAGISTRATE                                                                                                                         |
            | Dated                  | <DisplayDateLong>                                                                                                                                          |
            | Produced on            | <SearchDate>                                                                                                                                               |
        Then User Clears Downloaded PDFs
        # Application list cannot be deleted if it is CLOSED
        When User Makes DELETE API Request To "/application-lists/:listId"
        Then User Verify Response Status Code Should Be "400"
        Examples:
            | User  | TableName | SearchDate | APIDate  | DisplayDate  | DisplayDateLong  | Time           | courtLocationCode | Court                             | Description                             | durationHours | durationMinutes | Entries | Status | SelectButtonText | PDFNameContinuous                                     | PDFNamePage                                           | Pages |
            | user1 | Lists     | today      | todayiso | todaydisplay | todaydisplaylong | timenowhhmm-2h | LCCC025           | Leeds Combined Court Centre Set 3 | Applications to review at Test_{SCENARIO_ID} | 0             | 5               | 1       | CLOSED | Select           | leeds-combined-court-centre-set-3-todayiso-print-cont | leeds-combined-court-centre-set-3-todayiso-print-page | 1     |

    @regression @applicationsList @ARCPOC-214 @ARCPOC-575 @ARCPOC-1037 @ARCPOC-1688
    Scenario Outline: Verify application list is deleted successfully for applications list NO entries
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
            | <SearchDate> |      | <Description>    |             |       |                    |                            |                       |           |
        When User Clicks "<SelectButtonText>" Then "Open" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | 0       | <Status> |
        Then User Clicks On The Link "List details"
        Then User Verify The Page URL Contains "#list-details"
        Then User See "List details" On The Page
        Then User Should See The Button "Delete list"
        When User Clicks On The "Delete list" Button
        Then User Sees Warning Alert "You are about to delete this application list and all of the application list entries. This action cannot be undone."
        Then User See "Are you sure you want to delete this application list?" On The Page
        Then User Clicks On The Link "Cancel"
        Then User Verify The Page URL Contains "#list-details"
        Then User See "List details" On The Page
        Then User Verifies The "List description" Textbox Has Value "<Description>"
        Then User Should See The Button "Delete list"
        When User Clicks On The "Delete list" Button
        Then User Sees Warning Alert "You are about to delete this application list and all of the application list entries. This action cannot be undone."
        Then User See "Are you sure you want to delete this application list?" On The Page
        When User Clicks On The "Yes - delete" Button
        Then User Sees Success Banner "Success Application list deleted successfully If you believe this was in error, please contact support."
        Then User Should See The Link "Create new list"
        Then User Clears The "List description" Textbox
        When User Set Date Field "Date" To "<SearchDate>"
        Then User Selects "Closed" In The "Select list status" Dropdown
        When User Clicks On The "Search" Button
        Then User Should See The Table "<TableName>"
        Then User Should Not See Row In Table "<TableName>" With Values:
            | Date          | Time   | Location | Description   | Entries | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | 0       | <Status> |
        Examples:
            | User  | TableName | SearchDate | APIDate  | DisplayDate  | Time           | courtLocationCode | Court                             | Description                             | Status | SelectButtonText |
            | user1 | Lists     | today      | todayiso | todaydisplay | timenowhhmm-3h | LCCC025           | Leeds Combined Court Centre Set 3 | Applications to review at Test_{SCENARIO_ID} | OPEN   | Select           |

    @regression @applicationsList @ARCPOC-214 @ARCPOC-575 @ARCPOC-1037
    Scenario Outline: Verify application list is deleted successfully for applications list 1 entry
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date      | time   | status   | description   | courtLocationCode   |
            | <APIDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
        Then User Verify Response Status Code Should Be "201"
        Then User Stores Response Body Property "id" As "listId"
        When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
            | standardApplicantCode                         | null                           |
            | applicationCode                               | AP99001                        |
            | applicant.person.name.title                   | Mr                             |
            | applicant.person.name.lastName                | Taylor {SCENARIO_ID}                |
            | applicant.person.name.firstName               | Henry                          |
            | applicant.person.name.middleName              | James                          |
            | applicant.person.contactDetails.addressLine1  | {SCENARIO_ID} King Street           |
            | applicant.person.contactDetails.addressLine2  | Westminster                    |
            | applicant.person.contactDetails.addressLine3  | London                         |
            | applicant.person.contactDetails.addressLine4  | Greater London                 |
            | applicant.person.contactDetails.addressLine5  | United Kingdom                 |
            | applicant.person.contactDetails.postcode      | SW1A 1AA                       |
            | applicant.person.contactDetails.phone         | 0203{RANDOM}                   |
            | applicant.person.contactDetails.mobile        | 07123{RANDOM}                  |
            | applicant.person.contactDetails.email         | applicant{SCENARIO_ID}@example.com  |
            | respondent.person.name.title                  | Ms                             |
            | respondent.person.name.lastName               | Clark {SCENARIO_ID}                 |
            | respondent.person.name.firstName              | Emily                          |
            | respondent.person.name.middleName             | Rose                           |
            | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Road           |
            | respondent.person.contactDetails.addressLine2 | Bristol                        |
            | respondent.person.contactDetails.addressLine3 | Avon                           |
            | respondent.person.contactDetails.addressLine4 | United Kingdom                 |
            | respondent.person.contactDetails.postcode     | BS15 5AA                       |
            | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
            | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
            | respondent.person.contactDetails.email        | respondent{SCENARIO_ID}@example.com |
            | respondent.person.dateOfBirth                 | todayiso-25y                   |
            | wordingFields.0.key                           | Date of Hearing                |
            | wordingFields.0.value                         | "{SCENARIO_ID}"                     |
            | hasOffsiteFee                                 | true                           |
            | caseReference                                 | CASE-{RANDOM}                  |
            | accountNumber                                 | ACC-{RANDOM}                   |
            | notes                                         | Case noted with ref {SCENARIO_ID}   |
            | lodgementDate                                 | todayiso                       |
            | officials.0.title                             | Mr                             |
            | officials.0.surname                           | Turner {SCENARIO_ID}                |
            | officials.0.forename                          | Graham                         |
            | officials.0.type                              | MAGISTRATE                     |
            | officials.1.title                             | Ms                             |
            | officials.1.surname                           | Hayes {SCENARIO_ID}                 |
            | officials.1.forename                          | Laura                          |
            | officials.1.type                              | MAGISTRATE                     |
            | officials.2.title                             | Mr                             |
            | officials.2.surname                           | Miller {SCENARIO_ID}                |
            | officials.2.forename                          | Peter                          |
            | officials.2.type                              | CLERK                          |
            | officials.3.title                             | Ms                             |
            | officials.3.surname                           | Patel {SCENARIO_ID}                 |
            | officials.3.forename                          | Anita                          |
            | officials.3.type                              | MAGISTRATE                     |
        Then User Verify Response Status Code Should Be "201"
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "<User>"
        When User Searches Application List With:
            | Date         | Time | List description | CourtSearch         | Court   | Select list status | Other location description | Criminal justice area | CJASearch |
            | <SearchDate> |      |                  | <courtLocationCode> | <Court> |                    |                            |                       |           |
        When User Clicks "<SelectButtonText>" Then "Delete" From Menu In Row Of Table "<TableName>" With:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Then User Sees Warning Alert "You are about to delete this application list and all of the application list entries. This action cannot be undone."
        Then User See "Are you sure you want to delete this application list?" On The Page
        Then User Should See Row In Table With Values:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        When User Clicks On The "Yes - delete" Button
        Then User Should See The Link "Create new list"
        Then User Sees Success Banner "Success Application list deleted successfully If you believe this was in error, please contact support."
        When User Set Date Field "Date" To "<SearchDate>"
        When User Clicks On The "Search" Button
        Then User Should Not See Row In Table "<TableName>" With Values:
            | Date          | Time   | Location | Description   | Entries   | Status   |
            | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
        Examples:
            | User  | TableName | SearchDate | APIDate  | DisplayDate  | Time           | courtLocationCode | Court                             | Description                             | Entries | Status | SelectButtonText |
            | user1 | Lists     | today      | todayiso | todaydisplay | timenowhhmm-3h | LCCC025           | Leeds Combined Court Centre Set 3 | Applications to review at Test_{SCENARIO_ID} | 1       | OPEN   | Select           |
