'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">appreg-frontend documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search">
    <input type="text" placeholder="Type to search">
    <button type="button"
        class="search-input-clear"
        aria-label="Clear search"
        data-search-input-clear>&times;</button>
</div>
` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="architecture.html" data-type="chapter-link">
                                        <span class="icon ion-ios-git-branch"></span>Architecture
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AccordionComponent.html" data-type="entity-link" >AccordionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ActivityAuditSectionComponent.html" data-type="entity-link" >ActivityAuditSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AlertComponent.html" data-type="entity-link" >AlertComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/App.html" data-type="entity-link" >App</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicantSectionComponent.html" data-type="entity-link" >ApplicantSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationCodeSearchComponent.html" data-type="entity-link" >ApplicationCodeSearchComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/Applications.html" data-type="entity-link" >Applications</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsList.html" data-type="entity-link" >ApplicationsList</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListBulkUpload.html" data-type="entity-link" >ApplicationsListBulkUpload</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListCloseComponent.html" data-type="entity-link" >ApplicationsListCloseComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListCreate.html" data-type="entity-link" >ApplicationsListCreate</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListDeleteComponent.html" data-type="entity-link" >ApplicationsListDeleteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListDetail.html" data-type="entity-link" >ApplicationsListDetail</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListDetailBulkUpdateFeesComponent.html" data-type="entity-link" >ApplicationsListDetailBulkUpdateFeesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListDetailSearchComponent.html" data-type="entity-link" >ApplicationsListDetailSearchComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListEntryCreate.html" data-type="entity-link" >ApplicationsListEntryCreate</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListEntryDeleteComponent.html" data-type="entity-link" >ApplicationsListEntryDeleteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListEntryDetail.html" data-type="entity-link" >ApplicationsListEntryDetail</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListEntryMoveComponent.html" data-type="entity-link" >ApplicationsListEntryMoveComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListFormComponent.html" data-type="entity-link" >ApplicationsListFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsListUpdateComponent.html" data-type="entity-link" >ApplicationsListUpdateComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationsResultSelectedComponent.html" data-type="entity-link" >ApplicationsResultSelectedComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ApplicationWordingHelpComponent.html" data-type="entity-link" >ApplicationWordingHelpComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AsyncJobProgressComponent.html" data-type="entity-link" >AsyncJobProgressComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BreadcrumbsComponent.html" data-type="entity-link" >BreadcrumbsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CivilFeeHelpComponent.html" data-type="entity-link" >CivilFeeHelpComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CivilFeeSectionComponent.html" data-type="entity-link" >CivilFeeSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ConfirmationDialogComponent.html" data-type="entity-link" >ConfirmationDialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DateInputComponent.html" data-type="entity-link" >DateInputComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DurationInputComponent.html" data-type="entity-link" >DurationInputComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DurationSectionComponent.html" data-type="entity-link" >DurationSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ErrorSummaryComponent.html" data-type="entity-link" >ErrorSummaryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FeesSectionComponent.html" data-type="entity-link" >FeesSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FeeUpdateConfirmComponent.html" data-type="entity-link" >FeeUpdateConfirmComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FooterComponent.html" data-type="entity-link" >FooterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ForbiddenComponent.html" data-type="entity-link" >ForbiddenComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/GovukTextareaComponent.html" data-type="entity-link" >GovukTextareaComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HeaderComponent.html" data-type="entity-link" >HeaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HelpDetailsComponent.html" data-type="entity-link" >HelpDetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HomeComponent.html" data-type="entity-link" >HomeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InternalErrorComponent.html" data-type="entity-link" >InternalErrorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ListMaintenanceSectionComponent.html" data-type="entity-link" >ListMaintenanceSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoadingSpinner.html" data-type="entity-link" >LoadingSpinner</a>
                            </li>
                            <li class="link">
                                <a href="components/Login.html" data-type="entity-link" >Login</a>
                            </li>
                            <li class="link">
                                <a href="components/MoveConfirmComponent.html" data-type="entity-link" >MoveConfirmComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NavigationWarningComponent.html" data-type="entity-link" >NavigationWarningComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotesSectionComponent.html" data-type="entity-link" >NotesSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotFoundComponent.html" data-type="entity-link" >NotFoundComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotificationBannerComponent.html" data-type="entity-link" >NotificationBannerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OfficialsSectionComponent.html" data-type="entity-link" >OfficialsSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/OrganisationSectionComponent.html" data-type="entity-link" >OrganisationSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PageHeaderComponent.html" data-type="entity-link" >PageHeaderComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PaginationComponent.html" data-type="entity-link" >PaginationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PaymentReferenceEditComponent.html" data-type="entity-link" >PaymentReferenceEditComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PersonSectionComponent.html" data-type="entity-link" >PersonSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PrivateProsecutorsIndexSectionComponent.html" data-type="entity-link" >PrivateProsecutorsIndexSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RadioButtonComponent.html" data-type="entity-link" >RadioButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/Reports.html" data-type="entity-link" >Reports</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportSelectorComponent.html" data-type="entity-link" >ReportSelectorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReportsSharedFormComponent.html" data-type="entity-link" >ReportsSharedFormComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RespondentBulkApplicationComponent.html" data-type="entity-link" >RespondentBulkApplicationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RespondentSectionComponent.html" data-type="entity-link" >RespondentSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ResultSelected.html" data-type="entity-link" >ResultSelected</a>
                            </li>
                            <li class="link">
                                <a href="components/ResultWordingSectionComponent.html" data-type="entity-link" >ResultWordingSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ReviewConfirmComponent.html" data-type="entity-link" >ReviewConfirmComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SearchBoxComponent.html" data-type="entity-link" >SearchBoxComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SearchWarrantsSectionComponent.html" data-type="entity-link" >SearchWarrantsSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SelectInputComponent.html" data-type="entity-link" >SelectInputComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ServiceNavigationComponent.html" data-type="entity-link" >ServiceNavigationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SortableTableComponent.html" data-type="entity-link" >SortableTableComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StandardApplicants.html" data-type="entity-link" >StandardApplicants</a>
                            </li>
                            <li class="link">
                                <a href="components/StandardApplicantSelectComponent.html" data-type="entity-link" >StandardApplicantSelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StandardApplicantsViewComponent.html" data-type="entity-link" >StandardApplicantsViewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SuccessBannerComponent.html" data-type="entity-link" >SuccessBannerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SuggestionsComponent.html" data-type="entity-link" >SuggestionsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SummaryListCardActionComponent.html" data-type="entity-link" >SummaryListCardActionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TableComponent.html" data-type="entity-link" >TableComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TextInputComponent.html" data-type="entity-link" >TextInputComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UpdateNotesComponent.html" data-type="entity-link" >UpdateNotesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UpdateOfficialsComponent.html" data-type="entity-link" >UpdateOfficialsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UpdateOfficialsConfirmComponent.html" data-type="entity-link" >UpdateOfficialsConfirmComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WordingParserComponent.html" data-type="entity-link" >WordingParserComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WordingSectionComponent.html" data-type="entity-link" >WordingSectionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkloadSectionComponent.html" data-type="entity-link" >WorkloadSectionComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#directives-links"' :
                                'data-bs-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/MojButtonMenuDirective.html" data-type="entity-link" >MojButtonMenuDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/PlaceFieldsBase.html" data-type="entity-link" >PlaceFieldsBase</a>
                                </li>
                                <li class="link">
                                    <a href="directives/ResultSelectedTableBase.html" data-type="entity-link" >ResultSelectedTableBase</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UpdateOfficialsTableBase.html" data-type="entity-link" >UpdateOfficialsTableBase</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AppConfigService.html" data-type="entity-link" >AppConfigService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ApplicationListEntryFormService.html" data-type="entity-link" >ApplicationListEntryFormService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ApplicationListEntryResultsFacade.html" data-type="entity-link" >ApplicationListEntryResultsFacade</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ApplicationListRecordsService.html" data-type="entity-link" >ApplicationListRecordsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ApplicationListSearchFormService.html" data-type="entity-link" >ApplicationListSearchFormService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ApplicationsListFormService.html" data-type="entity-link" >ApplicationsListFormService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ApplicationsSearchFormService.html" data-type="entity-link" >ApplicationsSearchFormService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ApplicationsSearchStateService.html" data-type="entity-link" >ApplicationsSearchStateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DateTimePipe.html" data-type="entity-link" >DateTimePipe</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntryDetailFeeSaveFacade.html" data-type="entity-link" >EntryDetailFeeSaveFacade</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntryDetailLoadFacade.html" data-type="entity-link" >EntryDetailLoadFacade</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EntryDetailSaveFacade.html" data-type="entity-link" >EntryDetailSaveFacade</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ErrorMessageService.html" data-type="entity-link" >ErrorMessageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HeaderService.html" data-type="entity-link" >HeaderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JobPollingFacade.html" data-type="entity-link" >JobPollingFacade</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MojButtonMenu.html" data-type="entity-link" >MojButtonMenu</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PdfService.html" data-type="entity-link" >PdfService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ReferenceDataFacade.html" data-type="entity-link" >ReferenceDataFacade</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SelectivePreloadingStrategy.html" data-type="entity-link" >SelectivePreloadingStrategy</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SessionService.html" data-type="entity-link" >SessionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StandardApplicantsSearchFormService.html" data-type="entity-link" >StandardApplicantsSearchFormService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StandardApplicantsSearchStateService.html" data-type="entity-link" >StandardApplicantsSearchStateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TelemetryErrorHandler.html" data-type="entity-link" >TelemetryErrorHandler</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TelemetryService.html" data-type="entity-link" >TelemetryService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/applicationListGuard.html" data-type="entity-link" >applicationListGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/canLeavePageGuard.html" data-type="entity-link" >canLeavePageGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/homeRedirectGuard.html" data-type="entity-link" >homeRedirectGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/sessionGuard.html" data-type="entity-link" >sessionGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AccordionItem.html" data-type="entity-link" >AccordionItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ActivityAuditReportFormValue.html" data-type="entity-link" >ActivityAuditReportFormValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApplicationsListBulkUploadState.html" data-type="entity-link" >ApplicationsListBulkUploadState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApplicationsListCreateState.html" data-type="entity-link" >ApplicationsListCreateState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApplicationsListDetailState.html" data-type="entity-link" >ApplicationsListDetailState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApplicationsListEntryCreateState.html" data-type="entity-link" >ApplicationsListEntryCreateState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApplicationsListEntryDetailState.html" data-type="entity-link" >ApplicationsListEntryDetailState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApplicationsListEntryMoveState.html" data-type="entity-link" >ApplicationsListEntryMoveState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApplicationsListState.html" data-type="entity-link" >ApplicationsListState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApplicationsState.html" data-type="entity-link" >ApplicationsState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BuildRespondentErrorsParams.html" data-type="entity-link" >BuildRespondentErrorsParams&lt;ErrorMessageMap&gt;</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BulkUpdateFeeState.html" data-type="entity-link" >BulkUpdateFeeState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BulkUploadFeedback.html" data-type="entity-link" >BulkUploadFeedback</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CanLeavePage.html" data-type="entity-link" >CanLeavePage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CellContext.html" data-type="entity-link" >CellContext&lt;T &#x3D; unknown&gt;</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ColumnDef.html" data-type="entity-link" >ColumnDef&lt;T &#x3D; unknown&gt;</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Duration.html" data-type="entity-link" >Duration</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DurationReportFormValue.html" data-type="entity-link" >DurationReportFormValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ErrorDescription.html" data-type="entity-link" >ErrorDescription</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ErrorMessage.html" data-type="entity-link" >ErrorMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FeesReportFormValue.html" data-type="entity-link" >FeesReportFormValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FormErrorMessages.html" data-type="entity-link" >FormErrorMessages</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FormRaw.html" data-type="entity-link" >FormRaw&lt;S&gt;</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HttpErrorSummary.html" data-type="entity-link" >HttpErrorSummary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ListMaintenanceReportFormValue.html" data-type="entity-link" >ListMaintenanceReportFormValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadEffectOptions.html" data-type="entity-link" >LoadEffectOptions&lt;TParams, TResponse&gt;</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LocationControls.html" data-type="entity-link" >LocationControls</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MojInitEl.html" data-type="entity-link" >MojInitEl</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PdfList.html" data-type="entity-link" >PdfList</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlaceFieldsState.html" data-type="entity-link" >PlaceFieldsState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlaceRefFacade.html" data-type="entity-link" >PlaceRefFacade</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PolledJobStatus.html" data-type="entity-link" >PolledJobStatus</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PpiReportFormValue.html" data-type="entity-link" >PpiReportFormValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProblemDetails.html" data-type="entity-link" >ProblemDetails</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProblemDetails-1.html" data-type="entity-link" >ProblemDetails</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/recordsState.html" data-type="entity-link" >recordsState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReferenceDataState.html" data-type="entity-link" >ReferenceDataState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportLocationFormValue.html" data-type="entity-link" >ReportLocationFormValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportOption.html" data-type="entity-link" >ReportOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportsState.html" data-type="entity-link" >ReportsState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SearchWarrantsReportFormValue.html" data-type="entity-link" >SearchWarrantsReportFormValue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SelectOption.html" data-type="entity-link" >SelectOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StandardApplicantSelectPagingState.html" data-type="entity-link" >StandardApplicantSelectPagingState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StandardApplicantSummaryListValues.html" data-type="entity-link" >StandardApplicantSummaryListValues</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SubmitValidatableSection.html" data-type="entity-link" >SubmitValidatableSection</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WorkloadReportFormValue.html" data-type="entity-link" >WorkloadReportFormValue</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#pipes-links"' :
                                'data-bs-target="#xs-pipes-links"' }>
                                <span class="icon ion-md-funnel"></span>
                                <span>Pipes</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="pipes-links"' : 'id="xs-pipes-links"' }>
                                <li class="link">
                                    <a href="pipes/DateTimePipe.html" data-type="entity-link" >DateTimePipe</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});
