import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccessDeniedService {
  visible = signal(false);
  message = signal('');

  open(message: string = 'Acceso Denegado. No cuentas con los permisos necesarios para acceder a esta sección. Si consideras que es un error, contacta al administrador.') {
    this.message.set(message);
    this.visible.set(true);
  }

  close() {
    this.visible.set(false);
    this.message.set('');
  }
}
