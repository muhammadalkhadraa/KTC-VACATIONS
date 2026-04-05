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
  startDate: string;    // 'YYYY-MM-DD'
  endDate: string;      // 'YYYY-MM-DD'
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  managerStatus: 'pending' | 'approved' | 'rejected';
  managerId: string;
  gmStatus: 'pending' | 'approved' | 'rejected';
  gmId: string;
  submittedAt: string;  // ISO date string
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
