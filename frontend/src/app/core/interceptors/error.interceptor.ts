import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

function translateErrorMessage(msg: string): string {
  if (!msg) return msg;
  let translated = msg;
  
  const translations: { [key: string]: string } = {
    'should not be empty': 'no debe estar vacío/a',
    'must be a string': 'debe ser una cadena de texto',
    'must be an email': 'debe ser un correo electrónico válido',
    'must be an integer number': 'debe ser un número entero',
    'must be a positive number': 'debe ser un número positivo',
    'must be a number': 'debe ser un número',
    'must be a UUID': 'debe ser un identificador único (UUID) válido',
    'must be a valid ISO 8601 date string': 'debe ser una fecha válida (ISO 8601)',
    'must be longer than or equal to': 'debe tener al menos',
    'characters': 'caracteres',
    'Unauthorized': 'No autorizado',
    'Forbidden resource': 'Acceso denegado. No tiene permisos para realizar esta acción.',
    'Internal server error': 'Error interno del servidor.',
    'Bad Request': 'Solicitud incorrecta',
    'Not Found': 'No encontrado',
    'Conflict': 'Conflicto de datos',
    'email must be an email': 'El correo electrónico debe ser un correo válido',
    'password must be longer than or equal to 6 characters': 'La contraseña debe tener al menos 6 caracteres'
  };

  Object.keys(translations).forEach(key => {
    const regex = new RegExp(key, 'gi');
    translated = translated.replace(regex, translations[key]);
  });

  return translated;
}

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
          const msgArray = Array.isArray(msg) ? msg : [msg];
          errorMsg = msgArray.map((m: string) => translateErrorMessage(m)).join(', ');
        } else {
          errorMsg = `Error ${error.status}: ${error.statusText}`;
        }
      }

      toastService.error(errorMsg);
      return throwError(() => error);
    })
  );
};
