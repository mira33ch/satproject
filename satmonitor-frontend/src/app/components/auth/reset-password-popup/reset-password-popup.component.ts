import { Component, EventEmitter, Input, Output } from '@angular/core';

type Field = 'newPassword' | 'confirmPassword' | 'token';

@Component({
  selector: 'app-reset-password-popup',
  templateUrl: './reset-password-popup.component.html',
  styleUrls: ['./reset-password-popup.component.css']
})
export class ResetPasswordPopupComponent {
  @Input() token = '';
  @Output() submitted = new EventEmitter<{ token: string; newPassword: string }>();

  newPassword = '';
  confirmPassword = '';

  showNew = false;
  showConfirm = false;

  loading = false;
  success = false;

  errors: Partial<Record<Field, string>> = {};

  onChange(field: 'newPassword' | 'confirmPassword', evOrValue: unknown): void {
    const v = this.extractValue(evOrValue);

    if (field === 'newPassword') this.newPassword = v;
    if (field === 'confirmPassword') this.confirmPassword = v;

    if (this.errors[field]) delete this.errors[field];
  }

  submit(): void {
    this.success = false;
    this.errors = {};

    if (!this.token) {
      this.errors.token = 'Lien invalide ou expiré (token manquant).';
      return;
    }

    const p1 = this.newPassword.trim();
    const p2 = this.confirmPassword.trim();

    if (!p1) {
      this.errors.newPassword = 'Champ obligatoire';
      return;
    }
    if (p1.length < 8) {
      this.errors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
      return;
    }
    if (!p2) {
      this.errors.confirmPassword = 'Champ obligatoire';
      return;
    }
    if (p1 !== p2) {
      this.errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      return;
    }

    // Emit vers la page (qui fera l’appel backend)
    this.loading = true;
    this.submitted.emit({ token: this.token, newPassword: p1 });

    // UX temporaire (en attendant backend)
    this.loading = false;
    this.success = true;
  }

  private extractValue(evOrValue: unknown): string {
    if (typeof evOrValue === 'string') return evOrValue;

    if (evOrValue instanceof Event) {
      return (evOrValue.target as HTMLInputElement)?.value ?? '';
    }

    if (evOrValue && typeof evOrValue === 'object' && 'value' in (evOrValue as any)) {
      return String((evOrValue as any).value ?? '');
    }

    return '';
  }
}
