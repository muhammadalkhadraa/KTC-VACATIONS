import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AttendanceRecord, CheckInStatus } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(private supabaseSvc: SupabaseService) { }

  private readonly SELECT_ALL = 'id, empId:emp_id, state, checkInTime:check_in_time, checkOutTime:check_out_time';

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
  toRecord(status: CheckInStatus): AttendanceRecord {
    const { checkInTime, checkOutTime } = status;
    let recordStatus: AttendanceRecord['status'] = 'Absent';
    let dateStr     = '';
    let checkInStr  = '—';
    let checkOutStr = '—';

    if (checkInTime) {
      const d    = new Date(checkInTime);
      const mins = d.getHours() * 60 + d.getMinutes(); // local clock

      if      (mins < 8 * 60)       recordStatus = 'Early';
      else if (mins <= 8 * 60 + 10) recordStatus = 'Present';
      else                          recordStatus = 'Late';

      // Local YYYY-MM-DD
      const y  = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      dateStr  = `${y}-${mo}-${dy}`;
      checkInStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    let overtimeStr = '—';

    if (checkOutTime) {
      const outD = new Date(checkOutTime);
      checkOutStr = outD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      const outMins = outD.getHours() * 60 + outD.getMinutes();
      // Work ends at 17:30 (1050 mins). Grace period is until 17:45 (1065 mins).
      if (outMins >= (17 * 60 + 45)) {
        const overtimeMins = outMins - (17 * 60 + 30); // count time sitting past 17:30
        const h = Math.floor(overtimeMins / 60);
        const m = overtimeMins % 60;
        overtimeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }
    }

    return { date: dateStr, status: recordStatus, checkIn: checkInStr, checkOut: checkOutStr, overtime: overtimeStr };
  }

  getSummary(records: AttendanceRecord[]) {
    return {
      present: records.filter(r => r.status === 'Present').length,
      absent:  records.filter(r => r.status === 'Absent').length,
      late:    records.filter(r => r.status === 'Late').length,
      early:   records.filter(r => r.status === 'Early').length,
    };
  }
}
