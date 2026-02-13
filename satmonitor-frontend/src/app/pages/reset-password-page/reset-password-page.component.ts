import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password-page',
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.css']
})
export class ResetPasswordPageComponent implements OnInit {
  token = '';
  pageMessage = '';
  pageMessageType: 'success' | 'error' = 'success';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    // Nettoyage de l'URL : enlève ?token=... de l'historique
    if (this.token) {
      const cleanUrl = window.location.pathname; // garde /reset-password
      window.history.replaceState({}, document.title, cleanUrl);
    }
    if (!this.token) {
      this.pageMessageType = 'error';
      this.pageMessage = 'Lien invalide ou expiré (token manquant).';
    }
  }

  onSubmitted(payload: { token: string; newPassword: string }): void {
    // TODO backend call
    // this.authService.resetPassword(payload).subscribe(...)
    console.log('RESET PASSWORD PAYLOAD', payload);

    // feedback UI temporaire
    this.pageMessageType = 'success';
    this.pageMessage = 'Mot de passe mis à jour avec succès.';
  }
}
