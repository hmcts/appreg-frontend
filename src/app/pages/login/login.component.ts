import { AfterViewInit, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as GOVUKFrontend from 'govuk-frontend';

import { ApplicationService } from '../../services/application.service';
import { ApplicationListService } from '../../services/applications-list/application-list.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, AfterViewInit {
  passwordVisible = false;

  created = false;
  passwordReset = false;
  error: string | null = null;
  loginForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.created = params.get('created') === 'true';
    this.passwordReset = params.get('passwordReset') === 'true';
  }

  ngAfterViewInit(): void {
    GOVUKFrontend.initAll();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      console.warn('[LoginComponent] Form is invalid:', this.loginForm.value);
      return;
    }

    const creds = this.loginForm.value;
    console.log('[LoginComponent] Submitting login with creds:', creds);
    this.error = null;

    this.authService.login(this.loginForm.value).subscribe(
      (success: boolean) => {
        if (success) {
          this.router.navigate(['/applications-list']);
        } else {
          this.error = 'Invalid credentials';
        }
      },
      () => {
        this.error = 'An unexpected error occurred';
      }
    );
  }
}
