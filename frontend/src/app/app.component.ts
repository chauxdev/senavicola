import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { AccessDeniedModalComponent } from './shared/components/access-denied-modal/access-denied-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, AccessDeniedModalComponent],
  template: `
    <router-outlet />
    <app-toast-container />
    <app-access-denied-modal />
  `,
})
export class AppComponent {}
