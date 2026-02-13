import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/http_services/auth/auth.service';

@Component({
  selector: 'app-login-popup',
  templateUrl: './login-popup.component.html',
  styleUrls: ['./login-popup.component.css'],
})
export class LoginPopupComponent {
  @Output() close = new EventEmitter<void>();
  @Output() openRegister = new EventEmitter<void>();
  @Output() openForgot = new EventEmitter<void>();

  submitted = false;
  loading = false;
 apiError: { code: string, message: string, details?: any } | null = null;


  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false),
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get emailCtrl() {
    return this.form.get('email') as FormControl;
  }

  get passwordCtrl() {
    return this.form.get('password') as FormControl;
  }

  submit(): void {
    this.submitted = true;
     this.apiError = null;

    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const payload = {
      email: (this.emailCtrl.value || '').toString().trim(),
      password: (this.passwordCtrl.value || '').toString(),
      rememberMe: !!this.form.get('rememberMe')?.value,
    };

    this.loading = true;

    this.authService.login(payload).subscribe({
      next: (res: any) => {
        this.loading = false;

     console.log('Réponse du login :', res);

        // Fermer le popup
        this.close.emit();
        alert('Connexion reussie !');

  // Indiquer succès login
      alert('Connexion réussie !');

        // Redirection vers dashboard ou home
        this.router.navigate(['/dashboard']); 
     },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        console.error('Login error:', err);
        
        // Gestion des erreurs structurées
        if (err.error && err.error.errorCode) {
          this.apiError = {
            code: err.error.errorCode,
            message: err.error.message,
            details: err.error.details
          };
        } else {
          // Erreur non structurée
          this.apiError = {
            code: 'AUTH.UNKNOWN_ERROR',
            message: err.error?.message || err.message || 'Erreur de connexion'
          };
        }
        
        // Optionnel: scroll vers l'erreur
        setTimeout(() => {
          const errorElement = document.querySelector('.api-error');
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    });
  }

openForgotPassword(): void {
  this.openForgot.emit();
}
  onSocialLogin(provider: 'google' | 'facebook' | 'apple'): void {
    console.log('Social login pending:', provider);
  }

  goToRegister(): void {
    this.openRegister.emit();
  }

  requestClose(): void {
    this.close.emit();
  }
}
