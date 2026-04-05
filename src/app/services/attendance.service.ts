import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AttendanceRecord, CheckInStatus } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(private supabaseSvc: SupabaseService) { }

  private readonly SELECT_ALL = 'id, emp_id:empId, state, check_in_time:checkInTime, check_out_time:checkOutTime';

  getHistory(empId: string): Observable<CheckInStatus[]> {
    const id = empId.trim().toUpperCase();
    return from(
      this.supabaseSvc.supabase
        .from('check_ins')
        .select(this.SELECT_ALL)
        .eq('emp_id', id)
        .order('check_in_time', { ascending: false })
    ).pipe(
      map(({ data }) => (data as unknown as CheckInStatus[]) || [])
    );
  }

  /**
   * All check‑in rows recorded today (UTC).
   */
  getToday(): Observable<CheckInStatus[]> {
    const today = new Date().toISOString().split('T')[0];
    return from(
      this.supabaseSvc.supabase
        .from('check_ins')
        .select(this.SELECT_ALL)
        .gte('check_in_time', `${today}T00:00:00`)
        .lte('check_in_time', `${today}T23:59:59`)
    ).pipe(
      map(({ data }) => (data as unknown as CheckInStatus[]) || [])
    );
  }

  /**
   * Record a new state (in or out).
   */
  postStatus(status: Partial<CheckInStatus>): Observable<CheckInStatus> {
    const record = {
      emp_id: status.empId?.trim().toUpperCase(),
      state: status.state,
      check_in_time: status.state === 'in' ? new Date().toISOString() : status.checkInTime,
      check_out_time: status.state === 'out' ? new Date().toISOString() : status.checkOutTime
    };
    return from(
      this.supabaseSvc.supabase.from('check_ins').upsert([record]).select(this.SELECT_ALL).single()
    ).pipe(
      map(({ data }) => data as unknown as CheckInStatus)
    );
  }

  // convenience helpers
  toRecord(status: CheckInStatus): AttendanceRecord {
    return {
      date: status.checkInTime ? status.checkInTime.slice(0, 10) : '',
      status: status.state === 'in' ? 'Present' : status.state === 'out' ? 'Present' : 'Absent',
      checkIn: status.checkInTime ? status.checkInTime.slice(11, 16) : '—',
      checkOut: status.checkOutTime ? status.checkOutTime.slice(11, 16) : '—'
    };
  }

  getSummary(records: AttendanceRecord[]) {
    return {
      present: records.filter(r => r.status === 'Present').length,
      absent: records.filter(r => r.status === 'Absent').length,
      late: records.filter(r => r.status === 'Late').length,
    };
  }
}
