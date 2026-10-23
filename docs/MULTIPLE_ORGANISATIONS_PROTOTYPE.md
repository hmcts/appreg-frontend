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
   **No. of accounts**. Two organisation sections appear in **Respondent** as
   soon as the count changes. There is no extra Update respondents button.
4. Enter “Example Bank” and “Example Network” separately, with different made-up
   addresses or contact details. Edit either organisation directly in the form.
5. Select **Add another organisation**. A third section appears and the Wording
   count changes to **3**. Existing details remain.
6. Change the Wording count to **1**. Check the proposed removals, then select
   **Keep respondents**. All details remain and the count returns to **3**.
7. Repeat and confirm removal. Alternatively, remove a specific respondent.
   The Wording count always matches the remaining sections after confirmation.
8. Try zero, fractional, blank or excessive counts. The prototype supports 1–20.
9. Check that other application fields remain on the same form, then repeat on
   both Create and Edit using a keyboard and a narrow viewport.

## Saving limitation

The API contract currently accepts a single respondent. To avoid silently saving
only the first organisation, creating or updating an entry is blocked while
multiple respondents, an invalid count or an unconfirmed removal are present.
The form explains this limitation. Returning to one respondent restores the
existing save path; the normal field validation and **Apply wording** requirement
still apply. These changes do not imply that multi-respondent saving is supported.

The first organisation uses the existing respondent form group. Additional groups
use the same form builder, validators and organisation component. Live account
changes are separate from **Apply wording**, so editing the count does not silently
apply or save other wording. Templates without an account-count token retain their
existing respondent behavior. The recognised keys are **No. of accounts** and
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

Review whether one account always equals one respondent, how to handle multiple
accounts at one organisation, whether the last sections should be removed when
reducing the count, and which production limits should apply. Record feedback
against [ARCPOC-1290](https://hmcts.atlassian.net/browse/ARCPOC-1290).
A team review and stakeholder feedback still need to take place.

The design reuses the app's GDS/HMCTS organisation forms, accordion, validation and
buttons, with contextual actions, live announcements and keyboard focus handling.
A production implementation still needs a multiple-respondent API contract,
regenerated clients and mocks, persistence, and corresponding summary, report and
production-order output changes.
