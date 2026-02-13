import { Injectable } from '@angular/core';



@Injectable({
  providedIn: 'root'
})
export class TokenService {

 private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly TOKEN_EXPIRATION_KEY = 'token_expiration';

  /** Stocke l'access token */
  setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  /** Récupère l'access token */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /** Supprime l'access token */
  removeAccessToken(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }

  /** Stocke la date d'expiration */
  setTokenExpiration(expiresIn: number): void {
    // expiresIn est en secondes
    const expirationTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(this.TOKEN_EXPIRATION_KEY, expirationTime.toString());
  }

  /** Vérifie si le token est expiré */
  isTokenExpired(): boolean {
    const expiration = localStorage.getItem(this.TOKEN_EXPIRATION_KEY);
    if (!expiration) return true;

    return Date.now() > parseInt(expiration, 10);
  }

  /** Temps restant avant expiration (en secondes) */
  getTokenTimeLeft(): number {
    const expiration = localStorage.getItem(this.TOKEN_EXPIRATION_KEY);
    if (!expiration) return 0;

    const timeLeft = parseInt(expiration, 10) - Date.now();
    return Math.max(0, Math.floor(timeLeft / 1000));
  }

  /** Nettoie tout */
  clear(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRATION_KEY);
  }

  /** Vérifie s'il y a un token (même expiré) */
  hasToken(): boolean {
    return !!this.getAccessToken();
  }
}
