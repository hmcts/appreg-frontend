// src/app/app.module.ts
import { BrowserModule }            from '@angular/platform-browser';
import { NgModule }                 from '@angular/core';
import { ReactiveFormsModule }      from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {HTTP_INTERCEPTORS, provideHttpClient} from '@angular/common/http';   // standalone provider for HttpClient
import { AppRoutingModule }         from './app-routing.module';
import { AppComponent }             from './app.component';
import { LoginComponent }           from './pages/login/login.component';
import { AuthService }              from './services/auth.service';
import { TokenInterceptorService }  from "./auth/token-interceptor/token-interceptor.service";

// Note: using functional guard 'authGuard' in routes, no AuthGuard class/provider here

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    // provideHttpClient(),  // registers HttpClient providers
    AuthService, // authentication service
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorService, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
