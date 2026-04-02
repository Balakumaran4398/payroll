import { animate, query, style, transition, trigger } from '@angular/animations';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService, BusinessUnitType, LoginResponse } from 'src/app/core/services/auth.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';

type AuthView = 'signIn' | 'signUp' | 'forgot';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('formSwitch', [
      transition('* => *', [
        query(
          ':enter, :leave',
          [
            style({
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
            }),
          ],
          { optional: true }
        ),
        query(
          ':enter',
          [
            style({
              opacity: 0,
              transform: 'translateY(18px) scale(0.98)',
            }),
          ],
          { optional: true }
        ),
        query(
          ':leave',
          [
            animate(
              '180ms ease-in',
              style({
                opacity: 0,
                transform: 'translateY(-12px) scale(0.98)',
              })
            ),
          ],
          { optional: true }
        ),
        query(
          ':enter',
          [
            animate(
              '280ms 40ms cubic-bezier(0.22, 1, 0.36, 1)',
              style({
                opacity: 1,
                transform: 'translateY(0) scale(1)',
              })
            ),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})

export class LoginComponent implements OnInit {
  activeView: AuthView = 'signIn';

  signInForm: FormGroup;
  signUpForm: FormGroup;
  forgotPasswordForm: FormGroup;
  businessUnitTypes: BusinessUnitType[] = [];

  showSignInPassword = false;
  showSignUpPassword = false;
  showSignUpConfirmPassword = false;

  loading = false;
  loadingBusinessUnitTypes = false;
  errorMessage = '';
  successMessage = '';

  private readonly passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private storage: TokenStorageService,
    private feedback: UiFeedbackService,
  ) {
    this.signInForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      // password: ['', [Validators.required, Validators.pattern(this.passwordPattern)]],
      password: ['', [Validators.required,]],
      rememberMe: [false],
    });

    this.signUpForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        companyTypeId: [null, [Validators.required]],
        mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        email: ['', [Validators.required, Validators.email]],
        // password: ['', [Validators.required, Validators.pattern(this.passwordPattern)]],
        password: ['', [Validators.required, Validators.pattern(/^.{8,}$/)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: LoginComponent.passwordsMatchValidator }
    );

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    if (this.authService.hasValidSession()) {
      this.router.navigate(['/app/dashboard'], { replaceUrl: true });
      return;
    }

    const rememberedUsername = this.authService.getRememberedUsername();
    if (rememberedUsername) {
      const rememberedEmail = rememberedUsername.indexOf('@') > -1
        ? rememberedUsername
        : rememberedUsername + '@demo.app';

      this.signInForm.patchValue({
        username: rememberedEmail,
        rememberMe: true,
      });
    }

    this.loadBusinessUnitTypes();
  }

  switchView(view: AuthView): void {
    this.activeView = view;
    this.errorMessage = '';
    this.successMessage = '';

    if (view === 'signUp' && !this.businessUnitTypes.length && !this.loadingBusinessUnitTypes) {
      this.loadBusinessUnitTypes();
    }
  }

  submitSignIn(): void {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.getControlValue(this.signInForm, 'username') || '';
    const payload = {
      username: this.getControlValue(this.signInForm, 'username'),
      password: this.getControlValue(this.signInForm, 'password'),
      // rememberMe: this.getControlValue(this.signInForm, 'rememberMe'),
    };
    console.log(payload);

    this.authService
      .login(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/app/dashboard';
          const welcomeMessage = this.buildWelcomeMessage(response);

          this.router.navigateByUrl(returnUrl, { replaceUrl: true }).then((navigated) => {
            if (navigated) {
              this.feedback.welcome(welcomeMessage);
            }
          });
        },
        error: (err) => {
          if (err.status === 401) {
            this.errorMessage = 'Username or Password is incorrect';
          } else if (err.status === 0) {
            this.errorMessage = 'Server not reachable';
          } else {
            this.errorMessage = 'Something went wrong. Please try again';
          }
        }
      });
  }
  private buildWelcomeMessage(response: LoginResponse): string {
    console.log("1111111------------->", response);

    const displayName = this.authService.resolveDisplayName(response.employee_name, response.username);
    const roleName = this.formatRoleLabel(response.roles?.[0] || '');
    const roleMessage = roleName ? `Your ${roleName} workspace is ready.` : 'Your workspace is ready.';
    console.log("22222222222222222222------------->", displayName);

    return `Welcome ${displayName}. Have a nice day. ${roleMessage}`;
  }

  private formatRoleLabel(role: string): string {
    const normalized = `${role || ''}`.replace(/^ROLE_/, '').replace(/_/g, ' ').trim();
    return normalized
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  submitSignUp(): void {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    const registeredEmail = this.getControlValue(this.signUpForm, 'email');
    const payload = {
      name: this.getControlValue(this.signUpForm, 'name'),
      type: Number(this.getControlValue(this.signUpForm, 'companyTypeId')),
      parent_id: 0,
      mobile: this.getControlValue(this.signUpForm, 'mobile'),
      email: registeredEmail,
      isactive: true,
      isdelete: false,
      createddate: '',
      updateddate: '',
      password: this.getControlValue(this.signUpForm, 'password'),
    };

    console.log(payload);
    this.authService.createCompany(payload).pipe(
      finalize(() => {

        this.loading = false;
      })
    ).subscribe({
      next: (response) => {
        this.signInForm.patchValue({
          username: registeredEmail,
          rememberMe: true,
        });
        this.resetSignUpForm(true);
        this.successMessage = this.extractApiMessage(response, 'Account created successfully. You can sign in when ready.');
        this.activeView = 'signIn';
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.message ||
          'Unable to create the account right now. Please try again.';
      },
    });
  }

  submitForgotPassword(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.successMessage =
      'If an account exists for this email, a reset link has been sent.';
    this.errorMessage = '';
  }

  resetSignInForm(): void {
    this.signInForm.reset({
      username: '',
      password: '',
      rememberMe: false,
    });
    this.showSignInPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  resetSignUpForm(preserveFeedback = false): void {
    this.signUpForm.reset({
      name: '',
      companyTypeId: this.businessUnitTypes[0]?.id || null,
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    this.showSignUpPassword = false;
    this.showSignUpConfirmPassword = false;
    if (!preserveFeedback) {
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  resetForgotPasswordForm(): void {
    this.forgotPasswordForm.reset({
      email: '',
    });
    this.errorMessage = '';
    this.successMessage = '';
  }

  hasControlError(form: FormGroup, controlName: string, errorName: string): boolean {
    const control = form.get(controlName);
    return !!(
      control &&
      control.hasError(errorName) &&
      (control.touched || control.dirty)
    );
  }

  hasPasswordMismatch(): boolean {
    const confirmPassword = this.signUpForm.get('confirmPassword');
    return !!(
      this.signUpForm.hasError('passwordMismatch') &&
      confirmPassword &&
      (confirmPassword.touched || confirmPassword.dirty)
    );
  }

  private extractUsername(email: string): string {
    const emailParts = email.split('@');
    return emailParts[0] || email;
  }

  private getControlValue(form: FormGroup, controlName: string): any {
    const control = form.get(controlName);
    return control ? control.value : null;
  }

  private loadBusinessUnitTypes(): void {
    this.loadingBusinessUnitTypes = true;
    this.authService.getBusinessUnitTypes().pipe(
      finalize(() => {
        this.loadingBusinessUnitTypes = false;
      })
    ).subscribe({
      next: (types) => {
        this.businessUnitTypes = types;
        this.storage.saveBusinessUnits(types);

        if (!this.signUpForm.get('companyTypeId')?.value && types.length) {
          this.signUpForm.patchValue({
            companyTypeId: types[0].id,
          });
        }
      },
      error: () => {
        const cachedTypes = this.storage.getBusinessUnits();
        this.businessUnitTypes = Array.isArray(cachedTypes) ? cachedTypes : [];

        if (!this.signUpForm.get('companyTypeId')?.value && this.businessUnitTypes.length) {
          this.signUpForm.patchValue({
            companyTypeId: this.businessUnitTypes[0].id,
          });
        }
      },
    });
  }

  private extractApiMessage(response: any, fallback: string): string {
    const message = `${response?.message || response?.msg || response?.data?.message || ''}`.trim();
    return message || fallback;
  }

  private static passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }
}
