import { Injectable, signal, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from './auth.service';
import { HolidayService } from './holiday.service';
import { AttendanceService } from './attendance.service';
import { Employee, HolidayRequest, AttendanceRecord } from '../models/models';
import { catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {
  private auth = inject(AuthService);
  private holSvc = inject(HolidayService);
  private attSvc = inject(AttendanceService);

  // Global Signals
  readonly user = toSignal(this.auth.currentUser$);
  readonly myRequests = signal<HolidayRequest[]>([]);
  readonly attendanceHistory = signal<AttendanceRecord[]>([]);
  readonly isLoading = signal<boolean>(false);

  constructor() {
    effect(() => {
      const u = this.user(); 
      if (u) {
        untracked(() => this.fetchAll(u.id));
      } else {
        untracked(() => this.clear());
      }
    });
  }

  private fetchAll(empId: string) {
    this.isLoading.set(true);
    
    // Fetch Holidays
    this.holSvc.getForEmployee(empId).subscribe({
      next: res => this.myRequests.set(res),
      error: () => this.myRequests.set([])
    });

    // Fetch Attendance
    this.attSvc.getHistory(empId).pipe(
      catchError(() => of([]))
    ).subscribe(res => {
      const records = res.map(s => this.attSvc.toRecord(s));
      this.attendanceHistory.set(records);
      this.isLoading.set(false);
    });
  }

  private clear() {
    this.myRequests.set([]);
    this.attendanceHistory.set([]);
    this.isLoading.set(false);
  }

  refresh() {
    const u = this.user();
    if (u) this.fetchAll(u.id);
  }
}
