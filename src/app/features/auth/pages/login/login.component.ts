import { animate, query, style, transition, trigger } from '@angular/animations';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';

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

  showSignInPassword = false;
  showSignUpPassword = false;
  showSignUpConfirmPassword = false;

  loading = false;
  errorMessage = '';
  successMessage = '';

  private readonly passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signInForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      // password: ['', [Validators.required, Validators.pattern(this.passwordPattern)]],
      password: ['', [Validators.required, Validators.pattern(/^.{8,}$/)]],
      rememberMe: [false],
    });

    this.signUpForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
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
    const rememberedUsername = this.authService.getRememberedUsername();
    if (rememberedUsername) {
      const rememberedEmail = rememberedUsername.indexOf('@') > -1
        ? rememberedUsername
        : rememberedUsername + '@demo.app';

      this.signInForm.patchValue({
        email: rememberedEmail,
        rememberMe: true,
      });
    }
  }

  switchView(view: AuthView): void {
    this.activeView = view;
    this.errorMessage = '';
    this.successMessage = '';
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
        next: () => {
          this.router.navigate(['/app/dashboard']);
        },
        error: (err) => {
          if (err.status === 401) {
            // Unauthorized → wrong username/password
            this.errorMessage = 'Username or Password is incorrect';
          } else if (err.status === 0) {
            // Network error
            this.errorMessage = 'Server not reachable';
          } else {
            // Other errors
            this.errorMessage = 'Something went wrong. Please try again';
          }
        }
      });
  }

  submitSignUp(): void {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    const registeredEmail = this.getControlValue(this.signUpForm, 'email');

    this.signInForm.patchValue({
      email: registeredEmail,
      rememberMe: true,
    });

    this.successMessage = 'Account created successfully. You can sign in when ready.';
    this.errorMessage = '';
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

  resetSignUpForm(): void {
    this.signUpForm.reset({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    this.showSignUpPassword = false;
    this.showSignUpConfirmPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
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

  private static passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }
}
