import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { AccessDeniedModalComponent } from './shared/components/access-denied-modal/access-denied-modal.component';
import { ConfirmModalComponent } from './shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, AccessDeniedModalComponent, ConfirmModalComponent],
  template: `
    <router-outlet />
    <app-toast-container />
    <app-access-denied-modal />
    <app-confirm-modal />
  `,
})
export class AppComponent {}
