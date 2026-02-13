import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { tap, Observable, throwError, BehaviorSubject, catchError, of, switchMap } from 'rxjs';
import { environment } from 'src/environments/environments';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
 
  private baseUrl = `${environment.apiUrl}/login-service/api/v1/auth`;
  
 private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private tokenService: TokenService
  ) {}

  /** Inscription */
  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }
    

/** Création d'unité avec administrateur (deux étapes en une) */

registerUnitWithAdmin(data: any): Observable<any> {
  // Récupérer la langue du navigateur ou utiliser 'fr' par défaut
  const userLanguage = navigator.language || 'fr';
  const languageCode = userLanguage.split('-')[0]; // 'fr-FR' -> 'fr'
  
  return this.http.post(`${this.baseUrl}/register-with-admin`, data, {
    headers: { 
      'Content-Type': 'application/json',
      'Accept-Language': languageCode // <-- Ajout du header
    },
    withCredentials: true
  }).pipe(
    tap((response) => {
      console.log('Unit and admin created successfully:', response);
    })
  );
}



/** Connexion */
login(data: any): Observable<any> {
  return this.http.post<any>(`${this.baseUrl}/login`, data, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
  }).pipe(
    tap((response) => {
      console.log('✅ Login successful, storing token...');
      console.log('🔑 Access token received:', response.accessToken);
      
      // Stocke le token IMMÉDIATEMENT
      this.tokenService.setAccessToken(response.accessToken);
      
      if (response.expiresIn) {
        this.tokenService.setTokenExpiration(response.expiresIn);
      }
      
      // Vérifie que c'est bien stocké
      const storedToken = this.tokenService.getAccessToken();
      console.log('📝 Token stored in localStorage:', storedToken);
    })
    // ⚠️ ENLÈVE catchError pour laisser passer l'erreur brute
    // catchError(this.handleError)
  );
}



    /** Rafraîchissement du token - CORRECTION ICI */
  refreshToken(): Observable<any> {
    console.log('🔄 refreshToken() called');
    console.log('📝 Current token before refresh:', this.tokenService.getAccessToken());
    
    // Envoie une requête POST vide - le cookie refreshToken est envoyé automatiquement
    return this.http.post<any>(`${this.baseUrl}/refresh-token`, {}, {
      withCredentials: true
    }).pipe(
      tap((response) => {
        console.log('✅ Refresh token response received:', response);
        console.log('🔑 New access token:', response.accessToken);
        
        // Stocke le nouveau token DANS localStorage
        this.tokenService.setAccessToken(response.accessToken);
        
        if (response.expiresIn) {
          this.tokenService.setTokenExpiration(response.expiresIn);
        }
        
        // Vérifie que le token est bien stocké
        const storedToken = this.tokenService.getAccessToken();
        console.log('📝 New token stored in localStorage:', storedToken);
        console.log('✅ Token expiration set to:', response.expiresIn, 'seconds');
        
        // Émet le nouveau token pour les autres abonnés
        this.refreshTokenSubject.next(response.accessToken);
      }),
      catchError((error) => {
        console.error('❌ Refresh token failed:', error);
        // Force la déconnexion en cas d'erreur
        this.forceLogout();
        return throwError(() => error);
      })
    );
  }

  /** Pour l'interceptor */
  getRefreshTokenObservable(): Observable<string | null> {
    return this.refreshTokenSubject.asObservable();
  }
 

  /** Vérifie si l'utilisateur est connecté */
  isLoggedIn(): boolean {
    const token = this.tokenService.getAccessToken();
    if (!token) return false;

    // Vérifie si le token est expiré
    if (this.tokenService.isTokenExpired()) {
      return false;
    }

    return true;
  }

  /** Déconnexion */
  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        // Nettoie le stockage local
        this.tokenService.clear();
        this.router.navigate(['/dashboard/map']);
      }),
      catchError((error) => {
        // Même en cas d'erreur, nettoie côté frontend
        this.tokenService.clear();
        this.router.navigate(['/dashboard/map']);
        return throwError(() => error);
      })
    );
  }

  /** Force la déconnexion (en cas d'erreur) */
  forceLogout(): void {
    this.tokenService.clear();
    this.router.navigate(['/dashboard/map']);
  }

  /** Récupère l'access token (pour les interceptors) */
  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  /** Gestion des erreurs */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Session expirée, veuillez vous reconnecter';
    } else if (error.status === 403) {
      errorMessage = 'Accès non autorisé';
    }

    console.error('AuthService error:', error);
    return throwError(() => new Error(errorMessage));
  }




testApi(): Observable<any> {
  console.log('🔄 Testing endpoint:', "http://localhost:7079/login-service/test");
  console.log('🔑 Current token:', this.tokenService.getAccessToken());
  
  return this.http.get("http://localhost:7079/login-service/test", { 
    withCredentials: true,
    responseType: 'text'  // ⚠️ IMPORTANT : 'text' au lieu de 'json'
  }).pipe(
    tap(response => {
      console.log('✅ API Test Success - Response:', response);
    }),
    catchError(error => {
      console.error('❌ API Test Error:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        url: error.url
      });
      return throwError(() => error);
    })
  );
}

}