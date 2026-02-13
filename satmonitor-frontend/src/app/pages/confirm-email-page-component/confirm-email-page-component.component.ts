import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
type MessageType = 'success' | 'error' | '';
@Component({
  selector: 'app-confirm-email-page-component',
  templateUrl: './confirm-email-page-component.component.html',
  styleUrls: ['./confirm-email-page-component.component.css']
})
export class ConfirmEmailPageComponentComponent implements OnInit {
  token = '';
  email = '';

  loading = false;

  pageMessage = ''; // => clé translate
  pageMessageType: MessageType = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Exemple:
    // /auth/confirm-email?token=xxx&email=exemple@satmonitor.com
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';

    if (!this.token) {
      this.pageMessageType = 'error';
      this.pageMessage = 'CONFIRM_EMAIL.ERROR_TOKEN_MISSING';
    }
  }

  goToLanding(): void {
    this.router.navigate(['/']);
  }

  onValidate(): void {
    if (!this.token) return;

    this.loading = true;
    this.pageMessage = '';
    this.pageMessageType = '';

    // TODO: remplacer par ton service backend
    // this.authService.confirmEmail(this.token).subscribe({
    //   next: () => { ... },
    //   error: () => { ... }
    // });

    // Mock temporaire
    setTimeout(() => {
      this.loading = false;
      this.pageMessageType = 'success';
      this.pageMessage = 'CONFIRM_EMAIL.SUCCESS';
      // Option: redirect auto vers login
      // this.router.navigate(['/'], { queryParams: { openLogin: 1 } });
    }, 700);
  }
}