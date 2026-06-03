import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private idCounter = 0;

  show(type: Toast['type'], message: string, duration = 4000): void {
    const id = ++this.idCounter;
    this.toasts.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.remove(id), duration);
  }

  success(msg: string): void { this.show('success', msg); }
  error(msg: string): void { this.show('error', msg); }
  warning(msg: string): void { this.show('warning', msg); }
  info(msg: string): void { this.show('info', msg); }

  remove(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
