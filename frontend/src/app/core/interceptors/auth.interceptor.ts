import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { AccessDeniedService } from '../services/access-denied.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const accessDenied = inject(AccessDeniedService);

  const authReq = req.clone({
    withCredentials: true
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
      } else if (error.status === 403) {
        accessDenied.open();
        toast.error('No tienes permisos para realizar esta acción.');
      } else if (error.status === 0) {
        toast.error('No se pudo conectar con el servidor.');
      }
      return throwError(() => error);
    })
  );
};
