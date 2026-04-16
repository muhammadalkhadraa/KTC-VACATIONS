import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, catchError, of } from 'rxjs';
import { AttendanceRecord, CheckInStatus, WorkingHoursRule } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:5000/api/attendance';
  private rulesCache$: Observable<WorkingHoursRule[]> | null = null;

  getWorkingHours(forceRefresh = false): Observable<WorkingHoursRule[]> {
    if (!this.rulesCache$ || forceRefresh) {
      this.rulesCache$ = this.http.get<WorkingHoursRule[]>(`${this.API_URL}/working-hours`).pipe(
        shareReplay(1),
        catchError(() => {
          this.rulesCache$ = null;
          return of([]);
        })
      );
    }
    return this.rulesCache$;
  }

  getHistory(empId: string): Observable<CheckInStatus[]> {
    return this.http.get<CheckInStatus[]>(`${this.API_URL}/history/${empId}`).pipe(
      catchError(() => of([]))
    );
  }

  getToday(): Observable<CheckInStatus[]> {
    // Note: The logic for "today" can be refined based on the local API's history response
    // For now, let's filter from all history or add a specific today endpoint.
    // Given the dashboard uses getHistory(id), we'll mostly rely on that.
    return of([]); // Placeholder if specific "global today" is needed
  }

  postStatus(status: Partial<CheckInStatus>): Observable<CheckInStatus> {
    return this.http.post<CheckInStatus>(`${this.API_URL}/status`, status);
  }

  upsertWorkingHours(rule: WorkingHoursRule): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/working-hours`, rule);
  }

  deleteWorkingHours(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/working-hours/${id}`);
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  /**
   * Convert a raw DB row into a display-ready AttendanceRecord.
   * Arrival status relative to 8:00 AM (local time):
   *   before 08:00            → Early
   *   08:00 – 08:10 (grace)   → Present (On Time)
   *   after  08:10            → Late
   */
  toRecord(status: CheckInStatus, rules: WorkingHoursRule[] = []): AttendanceRecord {
    const { checkInTime, checkOutTime } = status;
    let recordStatus: AttendanceRecord['status'] = 'Absent';
    let dateStr     = '';
    let checkInStr  = '—';
    let checkOutStr = '—';
    let overtimeStr = '—';

    // Figure out the default check-in and check-out boundary
    let targetInTime = 8 * 60; // 08:00 AM
    let targetOutTime = 17 * 60 + 30; // 17:30 PM

    if (checkInTime) {
      const d    = new Date(checkInTime);
      const y  = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      dateStr  = `${y}-${mo}-${dy}`;
      checkInStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      const applicableRule = this.getRuleForDate(d, rules);
      if (applicableRule) {
         const [inH, inM] = applicableRule.check_in_time.split(':').map(Number);
         targetInTime = inH * 60 + inM;
         const [outH, outM] = applicableRule.check_out_time.split(':').map(Number);
         targetOutTime = outH * 60 + outM;
      }

      const mins = d.getHours() * 60 + d.getMinutes(); // local clock
      if      (mins < targetInTime)       recordStatus = 'Early';
      else if (mins <= targetInTime + 10) recordStatus = 'Present'; // Grace period 10 minutes
      else                                recordStatus = 'Late';
    }

    if (checkOutTime) {
      const outD = new Date(checkOutTime);
      checkOutStr = outD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      // Identify rule relative to checkout (in case of midnight crossover, rely on checkOut date)
      const applicableRule = this.getRuleForDate(outD, rules);
      if (applicableRule) {
         const [outH, outM] = applicableRule.check_out_time.split(':').map(Number);
         targetOutTime = outH * 60 + outM;
      }

      const outMins = outD.getHours() * 60 + outD.getMinutes();
      // Overtime grace period 15 mins
      if (outMins >= (targetOutTime + 15)) {
        const overtimeMins = outMins - targetOutTime; 
        const h = Math.floor(overtimeMins / 60);
        const m = overtimeMins % 60;
        overtimeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }
    }

    return { date: dateStr, status: recordStatus, checkIn: checkInStr, checkOut: checkOutStr, overtime: overtimeStr };
  }

  private getRuleForDate(d: Date, rules: WorkingHoursRule[]): WorkingHoursRule | undefined {
    // Rules are chronologically sorted descending, loop till we capture the bounds
    for (const r of rules) {
       const start = new Date(r.start_date);
       let end = new Date('2099-12-31');
       if (r.end_date) end = new Date(r.end_date);
       
       const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
       const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
       const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

       if (t >= s && t <= e) return r;
    }
    return undefined;
  }

  getSummary(records: AttendanceRecord[]) {
    return {
      present: records.filter(r => r.status === 'Present' || r.status === 'Early' || r.status === 'Late').length,
      absent:  records.filter(r => r.status === 'Absent').length,
      late:    records.filter(r => r.status === 'Late').length,
      early:   records.filter(r => r.status === 'Early').length,
    };
  }

  fillMissingDays(dbRecords: AttendanceRecord[], joined?: string): AttendanceRecord[] {
    const recordsMap = new Map<string, AttendanceRecord>();
    dbRecords.forEach(r => recordsMap.set(r.date, r));

    let start = new Date();
    start.setDate(start.getDate() - 30); // fallback 30 days
    if (joined) {
      const jDate = new Date(joined + 'T00:00:00');
      if (!isNaN(jDate.getTime())) start = jDate;
    }

    // Ensure we don't start later than the oldest recorded date
    if (dbRecords.length > 0) {
      const oldestRec = new Date(dbRecords[dbRecords.length - 1].date + 'T00:00:00');
      if (oldestRec < start) start = oldestRec;
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const todayMins = today.getHours() * 60 + today.getMinutes();

    const arr: AttendanceRecord[] = [];

    // Loop from start date up to today
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      
      if (recordsMap.has(dStr)) {
        arr.push(recordsMap.get(dStr)!);
      } else {
        const dayOfWeek = d.getDay();
        // Assume Friday (5) and Saturday (6) are weekends
        if (dayOfWeek === 5 || dayOfWeek === 6) {
          arr.push({ date: dStr, status: 'Weekend', checkIn: '—', checkOut: '—', overtime: '—' });
        } else {
          // Weekday missing record
          if (dStr < todayStr) {
            arr.push({ date: dStr, status: 'Absent', checkIn: '—', checkOut: '—', overtime: '—' });
          } else if (dStr === todayStr && todayMins >= (17 * 60 + 30)) {
            // Cutoff is 5:30 PM (1050 minutes)
            arr.push({ date: dStr, status: 'Absent', checkIn: '—', checkOut: '—', overtime: '—' });
          }
        }
      }
    }

    // Ensure it's sorted descending by date for the UI
    arr.sort((a, b) => b.date.localeCompare(a.date));
    return arr;
  }
}
