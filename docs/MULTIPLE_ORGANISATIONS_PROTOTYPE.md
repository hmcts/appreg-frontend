# Multiple respondents prototype (ARCPOC-1290)

The proposed functionality is part of the existing **Create new entry** and
**Applications list entry update** forms on this branch. There is no preview
switch and no second form. The normal Applicant, Application codes, Wording,
Respondent, fee, notes and results sections remain in place.

## Run locally

Start Docker Desktop. From `/Users/mustafaahmed/Projects/appreg-frontend`, run
`corepack enable` and `yarn dev:stub:no-sso`. Stop a separately running `yarn watch`
first to avoid a port conflict. Open [AppReg](http://localhost:4000).

Port 4000 serves the complete app, including the local session and API routes.
Port 4200 serves only the Angular frontend. For configured Azure sign-in instead,
run `yarn watch` and `yarn start:dev` in separate terminals, with the usual local
SSO and API configuration, then use port 4000.

Use made-up details. Trial additional respondents exist in this page's memory;
refreshing, navigating away or restarting clears them. They are not persisted.

## Try it in the existing forms

1. Open **Applications list**, select an open list and create or edit an entry.
2. In **Application codes**, search for **SW99032** with a lodgement date and
   select **Add code**. The local mocks include this production-order example.
   On Edit, choose this code if the entry currently uses a different one.
3. In the existing **Wording** section, enter an applicant name and **2** in
   **No. of accounts**. The Respondent section remains unchanged when you type,
   leave the field or select **Apply wording**. Select **Add another organisation**
   to create a second respondent.
4. Enter “Example Bank” and “Example Network” separately, with different made-up
   addresses or contact details. Select **Save respondent details** for each.
   Valid details collapse into compact summary cards. Pre-populated valid
   respondents also start as cards.
5. Use **Change** in a card header to reopen only that respondent; the other cards
   stay visible. Save the updated details or select **Cancel changes** to restore
   the previous details. Header **Remove** uses the existing removal confirmation.
   Saved respondents offer **Save respondent details** and **Cancel changes**
   while editing; **Remove** stays in the card header. Unsaved respondents offer
   **Cancel adding respondent** when another respondent remains.
   Details are held locally; this action does not save the application.
6. Select **Add another organisation**. A third section appears and the Wording
   count changes to **3**. Existing details remain.
7. Change the Wording count to **1**. All three respondent sections and their
   details remain, with no removal prompt.
8. Select **Remove** on a specific respondent and confirm removal. The selected
   section disappears and the Wording count updates to the remaining sections.
9. Try zero, fractional, blank or excessive counts. The prototype supports 1–20.
10. Check that other application fields remain on the same form, then repeat on
    both Create and Edit using a keyboard and a narrow viewport.

## Saving limitation

The API contract currently accepts a single respondent. To avoid silently saving
only the first organisation, creating or updating an entry is blocked while
multiple respondents, an invalid count or an unconfirmed removal are present.
The form explains this limitation. Returning to one respondent restores the
existing save path; the normal field validation and **Apply wording** requirement
still apply. These changes do not imply that multi-respondent saving is supported.

The cards reuse `SummaryListCardActionComponent`, extended with an optional
header-actions template. Existing single-action consumers keep their behavior;
summary rows share one definition list to reduce spacing. Only entered optional
contact details are shown. Local completion uses the same organisation validators
as the entry form, with error-summary links and focus handling.

The first organisation uses the existing respondent form group. Additional groups
use the same form builder, validators and organisation component. Leaving the
count field commits its final value without applying or saving other wording.
Selecting **Apply wording** also commits the final count, including when activated
from the keyboard without first leaving the field. Loading or editing the count
does not resize respondent sections or request removal. Use **Add another
organisation** and each respondent’s **Remove** action to manage sections; these
actions still update the Wording count. Templates without an account-count token
retain their existing respondent behavior. The recognised keys are **No. of accounts** and
**Number of accounts**, with punctuation/case variations.

The standalone [prototype](http://localhost:4200/prototypes/organisations) remains
available as an earlier, separate review aid; the journey above is in the actual
entry forms.

## Mock data and regeneration

Local scenarios for SW99032 live in `wiremock/custom-mappings/` and reference
made-up fixtures under `wiremock/__files/fixtures/prototypes/`. The mock generator
copies these custom mappings into its generated output after regeneration, so
`yarn dev:stub:no-sso` and `yarn mock:sync` retain the example. Other application-code
responses keep their existing mappings. Existing running WireMock containers may
need restarting after regeneration to load the added mappings.

## Team review

Review how to handle multiple accounts at one organisation, whether respondent
actions should continue updating the Wording count, and which production limits
should apply. Record feedback
against [ARCPOC-1290](https://hmcts.atlassian.net/browse/ARCPOC-1290).
A team review and stakeholder feedback still need to take place.

The design reuses the app's GDS/HMCTS organisation forms, accordion, validation and
buttons, with contextual actions, live announcements and keyboard focus handling.
A production implementation still needs a multiple-respondent API contract,
regenerated clients and mocks, persistence, and corresponding summary, report and
production-order output changes.
