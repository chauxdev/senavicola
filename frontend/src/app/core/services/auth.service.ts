import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, AuthProfile } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'senavicola_token';
  private readonly USER_KEY = 'senavicola_user';
  private readonly apiUrl = environment.apiUrl;

  currentUser = signal<AuthProfile | null>(this.getUserFromStorage());

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        // El backend envuelve las respuestas en { data: ... } via ResponseInterceptor
        const body = response.data ?? response;
        const user = body.usuario || body.user;
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user as AuthProfile);
      }),
      catchError((error) => {
        const msg = error.error?.message || 'Credenciales inválidas';
        return throwError(() => error);
      })
    );
  }

  loginAsGuest(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/guest`, {}).pipe(
      tap((response) => {
        const body = response.data ?? response;
        const user = body.usuario || body.user;
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user as AuthProfile);
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  getProfile(): Observable<AuthProfile> {
    return this.http.get<AuthProfile>(`${this.apiUrl}/auth/profile`).pipe(
      tap((profile) => {
        this.currentUser.set(profile);
        localStorage.setItem(this.USER_KEY, JSON.stringify(profile));
      })
    );
  }

  checkAuth(): Observable<{ valid: boolean }> {
    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/auth/check`);
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => {
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
      }
    });
  }

  getToken(): string | null {
    return null; // El token ahora se maneja en cookies HttpOnly
  }

  isAuthenticated(): boolean {
    return !!this.getUserFromStorage(); // Ahora verificamos si hay un usuario logueado
  }

  private getUserFromStorage(): AuthProfile | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
}
