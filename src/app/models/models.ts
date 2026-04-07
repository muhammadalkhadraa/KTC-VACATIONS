// ═══════════════════════════════════════
//  KTC Portal – Data Models
// ═══════════════════════════════════════

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  joined: string;       // 'YYYY-MM-DD'
  totalHolidays: number;
  usedHolidays: number;
  password: string;
  role: string;
}

export interface RegisterRequest {
  id: string;
  password: string;
  name: string;
  department: string;
  position: string;
}

export interface AttendanceRecord {
  date: string;         // 'YYYY-MM-DD'
  status: 'Present' | 'Absent' | 'Late' | 'Weekend';
  checkIn: string;      // 'HH:MM' or '—'
  checkOut: string;     // 'HH:MM' or '—'
}

export interface HolidayRequest {
  requestId: number;
  empId: string;
  emp_name: string;
  startDate: string;    // aliased from start_date
  end_date: string;     // 'YYYY-MM-DD'
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  manager_status: 'pending' | 'approved' | 'rejected';
  manager_id: string;
  gm_status: 'pending' | 'approved' | 'rejected';
  gm_id: string;
  submittedAt: string;  // aliased from submitted_at
}

export interface Role {
  id: number;
  name: string;
}

export interface CheckInStatus {
  id?: number;
  empId: string;
  state: 'none' | 'in' | 'out';
  checkInTime: string;
  checkOutTime: string;
}
