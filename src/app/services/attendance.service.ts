import { Injectable } from '@angular/core';
import { from, map, Observable, shareReplay } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AttendanceRecord, CheckInStatus, WorkingHoursRule } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(private supabaseSvc: SupabaseService) { }

  private readonly SELECT_ALL = 'id, empId:emp_id, state, checkInTime:check_in_time, checkOutTime:check_out_time';

  private rulesCache$: Observable<WorkingHoursRule[]> | null = null;

  getWorkingHours(forceRefresh = false): Observable<WorkingHoursRule[]> {
    if (!this.rulesCache$ || forceRefresh) {
      this.rulesCache$ = from(
        this.supabaseSvc.supabase.from('working_hours').select('*').order('start_date', { ascending: false })
      ).pipe(
        map((res: any) => res.data as WorkingHoursRule[] || []),
        shareReplay(1)
      );
    }
    return this.rulesCache$;
  }

  getHistory(empId: string): Observable<CheckInStatus[]> {
    const id = empId.trim().toUpperCase();
    return from(
      this.supabaseSvc.supabase
        .from('check_ins')
        .select(this.SELECT_ALL)
        .eq('emp_id', id)
        .order('check_in_time', { ascending: false })
    ).pipe(
      map((res: any) => {
        if (res.error) throw res.error;
        return (res.data as unknown as CheckInStatus[]) || [];
      })
    );
  }

  /** All check-in rows recorded today. */
  getToday(): Observable<CheckInStatus[]> {
    const today = new Date().toISOString().split('T')[0];
    return from(
      this.supabaseSvc.supabase
        .from('check_ins')
        .select(this.SELECT_ALL)
        .gte('check_in_time', `${today}T00:00:00`)
        .lte('check_in_time', `${today}T23:59:59`)
    ).pipe(
      map((res: any) => {
        if (res.error) throw res.error;
        return (res.data as unknown as CheckInStatus[]) || [];
      })
    );
  }

  /**
   * Record a new state (in or out).
   */
  postStatus(status: Partial<CheckInStatus>): Observable<CheckInStatus> {
    const record: Record<string, any> = {
      emp_id: status.empId?.trim().toUpperCase(),
      state:  status.state,
    };

    if (status.state === 'in') {
      record['check_in_time'] = new Date().toISOString();
    } else if (status.state === 'out') {
      record['check_in_time']  = status.checkInTime ?? null;
      record['check_out_time'] = new Date().toISOString();
      if (status.id) record['id'] = status.id; // update existing row
    }

    return from(
      this.supabaseSvc.supabase.from('check_ins').upsert([record]).select(this.SELECT_ALL).single()
    ).pipe(
      map((res: any) => {
        if (res.error) throw res.error;
        return res.data as unknown as CheckInStatus;
      })
    );
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
