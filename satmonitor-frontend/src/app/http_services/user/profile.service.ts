import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments';

export interface UserProfile {
  id?: number | string;
  firstName: string;
  lastName: string;
  email: string;
  roleLabel?: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  /**
   * ⚠️ À aligner avec ton backend.
   * Ici on reste dans la logique du projet : environment.apiUrl + microservice.
   */
  private baseUrl = `${environment.apiUrl}/login-service/api/v1/users`;

  constructor(private http: HttpClient) {}

  /** Profil courant */
  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/me`, {
      withCredentials: true
    });
  }

  /** MAJ profil */
  updateMe(payload: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/me`, payload, {
      withCredentials: true
    });
  }

  /** Changement mot de passe */
  changePassword(payload: ChangePasswordPayload): Observable<any> {
    return this.http.post(`${this.baseUrl}/me/change-password`, payload, {
      withCredentials: true
    });
  }

  /** Upload avatar (optionnel) */
  uploadAvatar(file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UserProfile>(`${this.baseUrl}/me/avatar`, formData, {
      withCredentials: true
    });
  }
}
