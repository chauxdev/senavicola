import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMsg = 'Ha ocurrido un error inesperado.';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMsg = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        if (error.status === 0) {
          errorMsg = 'No hay conexión con el servidor.';
        } else if (error.status >= 500) {
          errorMsg = 'Error en el servidor. Intente más tarde.';
        } else if (error.status === 401) {
          errorMsg = 'Sesión expirada o no autorizada.';
        } else if (error.error && error.error.message) {
          const msg = error.error.message;
          errorMsg = Array.isArray(msg) ? msg.join(', ') : msg;
        } else {
          errorMsg = `Error ${error.status}: ${error.statusText}`;
        }
      }

      toastService.error(errorMsg);
      return throwError(() => error);
    })
  );
};
