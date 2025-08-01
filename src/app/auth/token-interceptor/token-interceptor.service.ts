import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class TokenInterceptorService implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    console.log('[TokenInterceptor] Intercepting request to:', req.url);
    console.log('[TokenInterceptor] Token:', token);

    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('[TokenInterceptor] Added Authorization header');
      return next.handle(cloned);
    }

    console.warn('[TokenInterceptor] No token available, sending request without Authorization');
    return next.handle(req);
  }
}
