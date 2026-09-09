import { Directive, Input, TemplateRef, ViewContainerRef, effect } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { isAdminUser } from '../../core/utils/rbac.util';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private permission: string = '';

  @Input() set appHasPermission(permission: string) {
    this.permission = permission;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {
    effect(() => {
      // Re-evaluate whenever currentUser changes
      this.authService.currentUser();
      this.updateView();
    });
  }

  private updateView() {
    const user = this.authService.currentUser();
    const hasPerm = user?.permissions?.includes(this.permission);
    const isAdmin = isAdminUser(user);

    if (hasPerm || isAdmin) {
      if (this.viewContainer.length === 0) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      this.viewContainer.clear();
    }
  }
}
