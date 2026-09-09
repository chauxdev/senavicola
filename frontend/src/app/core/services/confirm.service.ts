import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  btnConfirmText?: string;
  btnCancelText?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  visible = signal(false);
  title = signal('Confirmar eliminación');
  message = signal('');
  btnConfirmText = signal('Eliminar');
  btnCancelText = signal('Cancelar');
  
  private resolveFn?: (value: boolean) => void;

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.title.set(options.title || 'Confirmar eliminación');
    this.message.set(options.message);
    this.btnConfirmText.set(options.btnConfirmText || 'Eliminar');
    this.btnCancelText.set(options.btnCancelText || 'Cancelar');
    this.visible.set(true);
    
    return new Promise<boolean>((resolve) => {
      this.resolveFn = resolve;
    });
  }

  handleConfirm() {
    this.visible.set(false);
    if (this.resolveFn) {
      this.resolveFn(true);
      this.resolveFn = undefined;
    }
  }

  handleCancel() {
    this.visible.set(false);
    if (this.resolveFn) {
      this.resolveFn(false);
      this.resolveFn = undefined;
    }
  }
}
