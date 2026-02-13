import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { BehaviorSubject, catchError, filter, finalize, Observable, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../http_services/auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔄 Interceptor - Request URL:', request.url);
    
    // Ne pas intercepter les requêtes d'authentification
    if (this.isAuthRequest(request)) {
      console.log('⏩ Skipping interceptor for auth request');
      return next.handle(request.clone({
        withCredentials: true
      }));
    }

    // Ajouter le token si disponible
    const token = this.authService.getAccessToken();
    let modifiedRequest = request.clone({
      withCredentials: true
    });

    if (token) {
      console.log('🔑 Adding token to request');
      modifiedRequest = modifiedRequest.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      console.log('');
    }

    return next.handle(modifiedRequest).pipe(
      catchError((error) => {
        console.log('❌ Interceptor - Error Status:', error.status);
        
        // Si c'est une erreur 401 et pas une requête d'auth
        if (error instanceof HttpErrorResponse && error.status === 401 && !this.isAuthRequest(request)) {
          console.log('🔄 401 detected, attempting token refresh...');
          return this.handle401Error(request, next);
        }
        
        // Pour toutes les autres erreurs
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔄 handle401Error called for:', request.url);
    
    // Si on est déjà en train de rafraîchir
    if (this.isRefreshing) {
      console.log('⏳ Already refreshing, waiting for token...');
      
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((token) => {
          console.log('🔄 Using waiting token for request');
          return this.retryRequest(request, next, token!);
        })
      );
    }
    
    // Sinon, on commence un nouveau rafraîchissement
    console.log('🔄 Starting new token refresh');
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.authService.refreshToken().pipe(
      switchMap((response: any) => {
        console.log('✅ Token refresh successful');
        
        // Récupère le nouveau token
        const newToken = this.authService.getAccessToken();
        console.log('🔑 New token from AuthService:', newToken);
        
        // Met à jour le BehaviorSubject
        this.isRefreshing = false;
        this.refreshTokenSubject.next(newToken);
        
        // Réessaie la requête originale
        return this.retryRequest(request, next, newToken!);
      }),
      catchError((refreshError) => {
        console.error('❌ Token refresh failed:', refreshError);
        
        this.isRefreshing = false;
        this.refreshTokenSubject.next(null);
        
        // Déconnexion forcée
        this.authService.forceLogout();
        return throwError(() => refreshError);
      }),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }

  private retryRequest(request: HttpRequest<any>, next: HttpHandler, token: string): Observable<HttpEvent<any>> {
    console.log('🔄 Retrying original request with new token');
    
    // Clone la requête avec le nouveau token
    const newRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    });
    
    return next.handle(newRequest);
  }

  private isAuthRequest(request: HttpRequest<any>): boolean {
    const url = request.url;
    return url.includes('/api/v1/auth/login') || 
           url.includes('/api/v1/auth/refresh-token') ||
           url.includes('/api/v1/auth/register') ||
           url.includes('/api/v1/auth/logout');
  }

}
