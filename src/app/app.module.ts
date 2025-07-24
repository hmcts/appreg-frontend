// src/app/app.module.ts
import { BrowserModule }            from '@angular/platform-browser';
import { NgModule }                 from '@angular/core';
import { ReactiveFormsModule }      from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import { AppRoutingModule }         from './app-routing.module';
import { AppComponent }             from './app.component';
import { LoginComponent }           from './pages/login/login.component';
import { AuthService }              from './services/auth.service';
import { TokenInterceptorService }  from "./auth/token-interceptor/token-interceptor.service";
import { DateInputComponent } from './shared/components/date-input/date-input.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { ServiceNavigationComponent } from './shared/components/service-navigation/service-navigation.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { TextInputComponent } from './shared/components/text-input/text-input.component';
import { DurationInputComponent } from './shared/components/duration-input/duration-input.component';
import { SortableTableComponent } from './shared/components/sortable-table/sortable-table.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent
  ],
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
    SortableTableComponent
  ],
  providers: [
    AuthService,
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
