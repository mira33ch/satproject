import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ProfileService, UserProfile } from 'src/app/http_services/user/profile.service';

type ProfileTab = 'info' | 'password';

@Component({
  selector: 'app-dashboard-profile',
  templateUrl: './dashboard-profile.component.html',
  styleUrls: ['./dashboard-profile.component.css']
})
export class DashboardProfileComponent implements OnInit {
  tab: ProfileTab = 'info';

  loading = false;
  savingInfo = false;
  savingPwd = false;

  // UI password visibility
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  user?: UserProfile;

  infoForm!: FormGroup;
  passwordForm!: FormGroup;

  // feedback (simple)
  infoSuccess = '';
  infoError = '';
  pwdSuccess = '';
  pwdError = '';

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadMe();
  }

  private initForms(): void {
    this.infoForm = this.fb.group({
      lastName: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      roleLabel: [{ value: '', disabled: true }]
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required, Validators.minLength(6)]],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
      },
      { validators: [this.passwordsMatchValidator] }
    );
  }

  private loadMe(): void {
    this.loading = true;
    this.profileService
      .getMe()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (u) => {
          this.user = u;
          this.infoForm.patchValue({
            lastName: u.lastName,
            firstName: u.firstName,
            email: u.email,
            roleLabel: u.roleLabel || ''
          });
        },
        error: (e) => {
          console.error(e);
          this.infoError = "Impossible de charger le profil";
        }
      });
  }

  setTab(t: ProfileTab): void {
    this.tab = t;
    this.infoSuccess = this.infoError = this.pwdSuccess = this.pwdError = '';
  }

  back(): void {
    history.back();
  }

  /** Avatar */
  onPickAvatar(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) return;

    this.infoSuccess = this.infoError = '';
    this.savingInfo = true;
    this.profileService
      .uploadAvatar(file)
      .pipe(finalize(() => (this.savingInfo = false)))
      .subscribe({
        next: (u) => {
          this.user = u;
          this.infoSuccess = 'Photo mise à jour';
          input.value = '';
        },
        error: (e) => {
          console.error(e);
          this.infoError = "Échec de la mise à jour de la photo";
        }
      });
  }

  /** MAJ infos */
  saveInfo(): void {
    this.infoSuccess = this.infoError = '';
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    const payload: Partial<UserProfile> = {
      lastName: this.infoForm.get('lastName')?.value,
      firstName: this.infoForm.get('firstName')?.value
    };

    this.savingInfo = true;
    this.profileService
      .updateMe(payload)
      .pipe(finalize(() => (this.savingInfo = false)))
      .subscribe({
        next: (u) => {
          this.user = u;
          this.infoSuccess = 'Profil mis à jour';
        },
        error: (e) => {
          console.error(e);
          this.infoError = 'Échec de la mise à jour';
        }
      });
  }

  /** Changement mdp */
  savePassword(): void {
    this.pwdSuccess = this.pwdError = '';

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const payload = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };

    this.savingPwd = true;
    this.profileService
      .changePassword(payload)
      .pipe(finalize(() => (this.savingPwd = false)))
      .subscribe({
        next: () => {
          this.pwdSuccess = 'Mot de passe mis à jour';
          this.passwordForm.reset();
        },
        error: (e) => {
          console.error(e);
          this.pwdError = e?.error?.message || 'Échec du changement de mot de passe';
        }
      });
  }

  /** Validator */
  private passwordsMatchValidator(group: FormGroup) {
    const a = group.get('newPassword')?.value;
    const b = group.get('confirmPassword')?.value;
    if (!a || !b) return null;
    return a === b ? null : { passwordMismatch: true };
  }

  get passwordMismatch(): boolean {
  const mismatch = !!this.passwordForm.errors?.['passwordMismatch'];
  const touched = !!this.passwordForm.get('confirmPassword')?.touched;
  const dirty = !!this.passwordForm.get('confirmPassword')?.dirty;
  return mismatch && (touched || dirty);
}

}
