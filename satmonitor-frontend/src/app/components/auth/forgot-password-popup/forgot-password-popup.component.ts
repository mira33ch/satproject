import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-forgot-password-popup',
  templateUrl: './forgot-password-popup.component.html',
  styleUrls: ['./forgot-password-popup.component.css']
})
export class ForgotPasswordPopupComponent {
  @Output() close = new EventEmitter<void>();
  @Output() submitEmail = new EventEmitter<string>();

  email = '';
  error = '';
  success = false;

  cancel(): void {
    this.close.emit();
  }

  onEmailChange(evOrValue: unknown): void {
    // compat sm-input (string) + fallback event/object
    let v = '';
    if (typeof evOrValue === 'string') v = evOrValue;
    else if (evOrValue instanceof Event) v = (evOrValue.target as HTMLInputElement)?.value ?? '';
    else if (evOrValue && typeof evOrValue === 'object' && 'value' in (evOrValue as any)) {
      v = String((evOrValue as any).value ?? '');
    }

    this.email = v;
    if (this.error) this.error = '';
  }

  confirm(): void {
    this.success = false;

    const mail = this.email.trim();
    if (!mail) {
      this.error = 'Champ obligatoire';
      return;
    }
    // check simple (tu peux renforcer plus tard)
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
    if (!ok) {
      this.error = 'Email invalide';
      return;
    }

    // Emission vers parent (landing / login) pour appeler API plus tard
    this.submitEmail.emit(mail);

    // feedback UX (maquette OK)
    this.success = true;

    // si tu veux fermer direct:
    // this.close.emit();
  }
}