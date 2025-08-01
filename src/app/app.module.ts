import { HTTP_INTERCEPTORS , HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TokenInterceptorService } from './auth/token-interceptor/token-interceptor.service';
import { LoginComponent } from './pages/login/login.component';
import { AuthService } from './services/auth.service';
import { DateInputComponent } from './shared/components/date-input/date-input.component';
import { DurationInputComponent } from './shared/components/duration-input/duration-input.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { PaginationComponent } from './shared/components/pagination/pagination.component';
import { ServiceNavigationComponent } from './shared/components/service-navigation/service-navigation.component';
import { SortableTableComponent } from './shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from './shared/components/text-input/text-input.component';

@NgModule({
  declarations: [AppComponent, LoginComponent],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    DateInputComponent,
    HeaderComponent,
    ServiceNavigationComponent,
    FooterComponent,
    TextInputComponent,
    DurationInputComponent,
    SortableTableComponent,
    PaginationComponent,
  ],
  providers: [AuthService, { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}
