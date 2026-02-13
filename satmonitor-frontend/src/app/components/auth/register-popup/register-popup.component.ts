import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from 'src/app/http_services/auth/auth.service';



@Component({
  selector: 'app-register-popup',
  templateUrl: './register-popup.component.html',
  styleUrls: ['./register-popup.component.css']
})
export class RegisterPopupComponent {
   @Output() close = new EventEmitter<void>();
  @Output() openLogin = new EventEmitter<void>();


  

  step: 1 | 2 = 1;
  loading = false;
  finalSubmitted = false;
  
  showPassword = false;
  showConfirmPassword = false;


  // Ajouter une variable pour l'erreur API
  apiError: { code: string, message: string, details?: any } | null = null;


  constructor(private authService: AuthService) {}

  /** Form global (2 étapes) */
  form = new FormGroup(
    {
      // STEP 1 - Entreprise
      companyName: new FormControl('', [Validators.required, Validators.maxLength(120)]),
      country: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      address: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      companyPhone: new FormControl('', [Validators.required]),
      
      // STEP 2 - Compte
      username: new FormControl('', [Validators.required, Validators.maxLength(80)]),
      email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(120)]),
       phone: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(64)]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(64)])
    },
    { 
      validators: [
        this.passwordsMatchValidator,
      ] 
    }
  );

  // --- Helpers controls
  // Step 1 - Entreprise
  get cCompanyName() { return this.form.get('companyName') as FormControl; }
  get cCountry() { return this.form.get('country') as FormControl; }
  get cAddress() { return this.form.get('address') as FormControl; }
  get cCompanyPhone() { return this.form.get('companyPhone') as FormControl; }

  // Step 2 - User
  get cUsername() { return this.form.get('username') as FormControl; }
  get cEmail() { return this.form.get('email') as FormControl; }
  get cPhone() { return this.form.get('phone') as FormControl; }
  get cPassword() { return this.form.get('password') as FormControl; }
  get cConfirmPassword() { return this.form.get('confirmPassword') as FormControl; }

  /** Navigation entre étapes */
  goStep(target: 1 | 2): void {
    this.step = target;
  }

  next(): void {
    if (this.step === 1) {
      this.cCompanyName.markAsTouched();
       this.cCountry.markAsTouched();
      this.cAddress.markAsTouched();
      this.cCompanyPhone.markAsTouched();
      
       if (this.cCompanyName.invalid || this.cCountry.invalid || 
          this.cAddress.invalid || this.cCompanyPhone.invalid) {
        return;
      }
      this.step = 2;
    }
  }

  previous(): void {
    this.step = 1;
  }

  cancel(): void {
    this.close.emit();
  }

  submit(): void {
    if (this.step === 1) {
      this.next();
      return;
    }

    this.apiError = null; // <-- Réinitialiser l'erreur API
    this.finalSubmitted = true;
    this.form.markAllAsTouched();
    
    const step2Valid = 
      this.cUsername.valid && 
      this.cEmail.valid && 
      this.cPhone.valid &&
      this.cPassword.valid && 
      this.cConfirmPassword.valid && 
      !this.form.errors?.['passwordMismatch'] 

     if (!step2Valid) {
      const step1Invalid = this.cCompanyName.invalid || this.cCountry.invalid || 
                           this.cAddress.invalid || this.cCompanyPhone.invalid;
      if (step1Invalid) {
        this.step = 1;
      }
      return;
    }

    // Préparation du payload
    const payload = {
      unit: {
        name: this.cCompanyName.value?.toString().trim(),
        country: this.cCountry.value?.toString().trim(),
        address: this.cAddress.value?.toString().trim(),
        phone: this.cCompanyPhone.value?.toString().trim()
      },
      adminUser: {
        username: this.cUsername.value?.toString().trim(),
        email: this.cEmail.value?.toString().trim(),
        phone: this.cPhone.value?.toString().trim(),
        password: this.cPassword.value?.toString(),
        roleReference: 'UNIT_ADMIN'
      }
    };

    this.loading = true;

   this.authService.registerUnitWithAdmin(payload).subscribe({
      next: (res) => {
        this.loading = false;
        console.log('✅ Création réussie:', res);
        this.close.emit();
        this.openLogin.emit();
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Erreur complète:', err);
        
        // Extraire les informations d'erreur du backend
        const errorCode = err.error?.errorCode;
        const errorMessage = err.error?.message;
        const errorDetails = err.error?.details;
        
        if (errorCode) {
          // Stocker l'erreur pour l'afficher dans le template
          this.apiError = {
            code: errorCode,
            message: errorMessage,
            details: errorDetails
          };
          
          // Mapper l'erreur au champ approprié
          this.mapErrorToField(errorCode, errorDetails);
        } else {
          // Pas de code d'erreur structuré
          this.apiError = {
            code: 'UNKNOWN_ERROR',
            message: err.error?.message || err.message || 'Erreur lors de la création'
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


 // Méthode pour mapper les erreurs aux champs spécifiques
  private mapErrorToField(errorCode: string, details: any): void {
    // Réinitialiser toutes les erreurs serveur
    this.cCompanyName.setErrors({ serverError: null });
    this.cCompanyPhone.setErrors({ serverError: null });
    this.cUsername.setErrors({ serverError: null });
    this.cEmail.setErrors({ serverError: null });
    this.cPhone.setErrors({ serverError: null });
    this.cCompanyPhone.setErrors({ serverError: null });

    // Mapper l'erreur au champ approprié
     if (errorCode === 'REGISTER.NAME_EXISTS') {
    this.cCompanyName.setErrors({ serverError: true });
    this.step = 1; // Aller à l'étape 1
  }
  else if (errorCode === 'REGISTER.PHONE_EXISTS') {
    this.cCompanyPhone.setErrors({ serverError: true });
    this.step = 1;
  }
    if (errorCode === 'REGISTER.USERNAME_EXISTS') {
      this.cUsername.setErrors({ serverError: true });
      this.step = 2; // Aller à l'étape 2 pour voir l'erreur
    } 
    else if (errorCode === 'REGISTER.EMAIL_EXISTS') {
      this.cEmail.setErrors({ serverError: true });
      this.step = 2;
    }
   else if (errorCode === 'REGISTER.PHONE_EXISTS') {
    // Vérifier si c'est le téléphone de l'entreprise ou de l'utilisateur
    if (details?.field === 'phone') {
      const phoneValue = details?.value;
      const userPhone = this.cPhone.value?.toString().trim();
      const companyPhone = this.cCompanyPhone.value?.toString().trim();
      
      if (phoneValue === userPhone) {
        this.cPhone.setErrors({ serverError: true });
      } else if (phoneValue === companyPhone) {
        this.cCompanyPhone.setErrors({ serverError: true });
        this.step = 1;
      }
    }
  }
    
    // Marquer le formulaire comme touché pour afficher les erreurs
    this.form.markAllAsTouched();
  }


  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    if (!p || !c) return null;
    return p === c ? null : { passwordMismatch: true };
  }


}