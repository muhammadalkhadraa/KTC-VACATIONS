import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttendanceRecord, CheckInStatus } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private api = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  /**
   * Retrieve raw check‑in rows for an employee.  The backend returns
   * `CheckInStatus` objects; components can transform them into
   * `AttendanceRecord` if needed.
   */
  getHistory(empId: string): Observable<CheckInStatus[]> {
    return this.http.get<CheckInStatus[]>(`${this.api}/${empId}`);
  }

  /**
   * All check‑in rows recorded today (UTC).
   */
  getToday(): Observable<CheckInStatus[]> {
    return this.http.get<CheckInStatus[]>(`${this.api}/today`);
  }

  /**
   * Record a new state (in or out).  The server timestamps times.
   */
  postStatus(status: Partial<CheckInStatus>): Observable<CheckInStatus> {
    return this.http.post<CheckInStatus>(this.api, status);
  }

  // convenience helpers for components that still want to build a summary
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
