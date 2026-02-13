import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
showLogin = false;
  showRegister = false;
  showForgot = false;

  onLearnMore(): void {}

  openForgot(): void {
    this.showLogin = false;
    this.showRegister = false;
    this.showForgot = true;
  }

  onForgotSubmit(email: string): void {
    console.log('FORGOT EMAIL', email);
    // TODO plus tard: call backend
    // ex: this.authService.forgotPassword(email).subscribe(...)
  }
}
