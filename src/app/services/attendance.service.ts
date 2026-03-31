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
  private readonly SELECT_ALL = 'Id:id, EmpId:empId, State:state, CheckInTime:checkInTime, CheckOutTime:checkOutTime';

  getHistory(empId: string): Observable<CheckInStatus[]> {
    const id = empId.trim().toUpperCase();
    return from(
      this.supabaseSvc.supabase
        .from('Attendance')
        .select(this.SELECT_ALL)
        .eq('EmpId', id)
        .order('CheckInTime', { ascending: false })
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
        .from('Attendance')
        .select(this.SELECT_ALL)
        .gte('CheckInTime', `${today}T00:00:00`)
        .lte('CheckInTime', `${today}T23:59:59`)
    ).pipe(
      map(({ data }) => (data as unknown as CheckInStatus[]) || [])
    );
  }

  /**
   * Record a new state (in or out).
   */
  postStatus(status: Partial<CheckInStatus>): Observable<CheckInStatus> {
    const record = {
      EmpId: status.empId?.trim().toUpperCase(),
      State: status.state,
      CheckInTime: status.state === 'in' ? new Date().toISOString() : status.checkInTime,
      CheckOutTime: status.state === 'out' ? new Date().toISOString() : status.checkOutTime
    };
    return from(
      this.supabaseSvc.supabase.from('Attendance').upsert([record]).select(this.SELECT_ALL).single()
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
