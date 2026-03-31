import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { AttendanceRecord, CheckInStatus } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(private supabaseSvc: SupabaseService) {}

  /**
   * Retrieve raw check‑in rows for an employee. 
   */
  getHistory(empId: string): Observable<CheckInStatus[]> {
    const id = empId.trim().toUpperCase();
    return from(
      this.supabaseSvc.supabase
        .from('attendance_records')
        .select('*')
        .eq('empId', id)
        .order('checkInTime', { ascending: false })
    ).pipe(
      map(({ data }) => (data || []) as CheckInStatus[])
    );
  }

  /**
   * All check‑in rows recorded today (UTC).
   */
  getToday(): Observable<CheckInStatus[]> {
    const today = new Date().toISOString().split('T')[0];
    return from(
      this.supabaseSvc.supabase
        .from('attendance_records')
        .select('*')
        .gte('checkInTime', `${today}T00:00:00`)
        .lte('checkInTime', `${today}T23:59:59`)
    ).pipe(
      map(({ data }) => (data || []) as CheckInStatus[])
    );
  }

  /**
   * Record a new state (in or out).
   */
  postStatus(status: Partial<CheckInStatus>): Observable<CheckInStatus> {
    const record = {
      ...status,
      empId: status.empId?.trim().toUpperCase(),
      checkInTime: status.state === 'in' ? new Date().toISOString() : status.checkInTime,
      checkOutTime: status.state === 'out' ? new Date().toISOString() : status.checkOutTime
    };
    return from(
      this.supabaseSvc.supabase.from('attendance_records').upsert([record]).select().single()
    ).pipe(
      map(({ data }) => data as CheckInStatus)
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
