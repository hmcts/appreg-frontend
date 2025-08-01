import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ApplicationCodesComponent } from './pages/application-codes/application-codes.component';
import { ApplicationCreateComponent } from './pages/application-create/application-create.component';
import { ApplicationDetailComponent } from './pages/application-detail/application-detail.component';
import { ApplicationViewComponent } from './pages/application-view/application-view.component';
import { ApplicationsComponent } from './pages/applications/applications.component';
import { ApplicationsListComponent } from './pages/applications-list/applications-list.component';
import { BulkUploadComponent } from './pages/bulk-upload/bulk-upload.component';
import { FeeDetailsComponent } from './pages/fee-details/fee-details.component';
import { LoginComponent } from './pages/login/login.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { StandardApplicantDetailComponent } from './pages/standard-applicant-detail/standard-applicant-detail.component';
import { StandardApplicantsComponent } from './pages/standard-applicants/standard-applicants.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'applications-list', component: ApplicationsListComponent },
  { path: 'applications-list/:id', component: ApplicationDetailComponent },
  { path: 'applications-list/:id/create', component: ApplicationCreateComponent },
  { path: 'applications-list/:id/create/application-codes', component: ApplicationCodesComponent },
  { path: 'applications-list/:id/bulk-upload', component: BulkUploadComponent },
  { path: 'applications-list/:id/bulk-upload/fee-details', component: FeeDetailsComponent },
  { path: 'applications', component: ApplicationsComponent },
  { path: 'applications/:id', component: ApplicationViewComponent },
  { path: 'standard-applicants', component: StandardApplicantsComponent },
  { path: 'standard-applicants/:id', component: StandardApplicantDetailComponent },
  { path: 'reports', component: ReportsComponent },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
