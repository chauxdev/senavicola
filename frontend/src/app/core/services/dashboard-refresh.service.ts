import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardRefreshService {
  private refreshSubject = new Subject<void>();

  // Observable stream to listen to refresh events
  refresh$ = this.refreshSubject.asObservable();

  // Call this method when a CRUD action happens in any module
  notifyDataChanged(): void {
    this.refreshSubject.next();
  }
}
