import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface LoginCreds {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'AUTH_TOKEN';
  private readonly LOGIN_URL = '/auth/token';

  constructor(private http: HttpClient) {}

  /**
   * POST credentials to /auth/token (proxied for CORS),
   * store the token on success, and emit `true`.
   * On error, emit `false`.
   */
  login(creds: LoginCreds): Observable<boolean> {
    return this.http.post<AuthResponse>(this.LOGIN_URL, creds).pipe(
      tap(res => localStorage.setItem(this.TOKEN_KEY, res.token)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  /** Returns true if we have a token in localStorage */
  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  /** Convenience getter, with a little logging */
  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('[AuthService] getToken →', token);
    return token;
  }

  /** Log out by clearing the token */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
