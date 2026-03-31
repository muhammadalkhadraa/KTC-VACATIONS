import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, from, map, Observable, of, tap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Employee, RegisterRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly STORAGE_KEY = 'ktc-current-user';

  private _currentUser = new BehaviorSubject<Employee | null>(null);
  currentUser$ = this._currentUser.asObservable();

  get currentUser(): Employee | null { return this._currentUser.value; }
  get isLoggedIn(): boolean          { return !!this._currentUser.value; }

  /** True if user is a manager (approves employee requests) */
  get isManager(): boolean {
    return this._currentUser.value?.position?.toLowerCase() === 'manager';
  }

  /** True if user is a general manager (approves manager requests, full admin access) */
  get isGeneralManager(): boolean {
    return this._currentUser.value?.position?.toLowerCase() === 'general manager';
  }

  /** True if either manager or general manager (can access admin panel) */
  get isAdmin(): boolean {
    return this.isManager || this.isGeneralManager;
  }

  constructor(private supabaseSvc: SupabaseService) {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Employee = JSON.parse(saved);
        if (parsed?.position) {
          parsed.position = parsed.position.toString().trim().toLowerCase();
        }
        if (parsed?.id) {
          parsed.id = String(parsed.id).trim().toUpperCase();
        }
        this._currentUser.next(parsed);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  login(id: string, password: string) {
    const empId = id.trim().toUpperCase();
    return from(
      this.supabaseSvc.supabase
        .from('employees')
        .select('*')
        .eq('id', empId)
        .eq('password', password)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return null;
        const res = data as any;
        const normalizedPosition = (res.position ?? '').toString().trim().toLowerCase();
        const emp: Employee = {
          id: String(res.id).trim().toUpperCase(),
          name: res.name,
          department: res.department || '',
          position: normalizedPosition,
          joined: res.joined || '',
          totalHolidays: res.totalHolidays || 0,
          usedHolidays: res.usedHolidays || 0,
          password: '',
          role: res.role || 'employee'
        };
        this._currentUser.next(emp);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(emp));
        return emp;
      }),
      catchError(() => of(null))
    );
  }

  logout(): void {
    this._currentUser.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  register(emp: Partial<Employee>) {
    const newEmp = {
      Id: emp.id,
      Name: emp.name,
      Department: emp.department,
      Position: emp.position,
      Joined: new Date().toISOString().split('T')[0],
      TotalHolidays: 21,
      UsedHolidays: 0
    };
    return from(this.supabaseSvc.supabase.from('employee').insert([newEmp]));
  }

  getEmployeeById(empId: string) {
    return from(
      this.supabaseSvc.supabase
        .from('employee')
        .select('Id:id, Name:name, Department:department, Position:position, Joined:joined, TotalHolidays:totalHolidays, UsedHolidays:usedHolidays, Password:password, Role:role')
        .eq('Id', empId)
        .single()
    ).pipe(
      map(({ data }) => data as unknown as Employee)
    );
  }

  /** Retrieve the list of users (admin feature). */
  getAllEmployees() {
    return from(
      this.supabaseSvc.supabase
        .from('employee')
        .select('Id:id, Name:name, Department:department, Position:position, Joined:joined, TotalHolidays:totalHolidays, UsedHolidays:usedHolidays, Password:password, Role:role')
    ).pipe(
      map(({ data }) => (data || []) as unknown as Employee[])
    );
  }

  updateUserRole(empId: string, role: string) {
    const id = empId.trim().toUpperCase();
    return from(this.supabaseSvc.supabase.from('employee').update({ Role: role }).eq('Id', id).select('Id:id, Role:role').single()).pipe(
      map(({ data }) => data as unknown as Employee)
    );
  }

  updateUserPosition(empId: string, position: string) {
    const id = empId.trim().toUpperCase();
    return from(this.supabaseSvc.supabase.from('employee').update({ Position: position }).eq('Id', id).select('Id:id, Position:position').single()).pipe(
      map(({ data }) => data as unknown as Employee)
    );
  }

  /** Update used holidays after an approval */
  addUsedHolidays(empId: string, days: number) {
    const id = empId.trim().toUpperCase();
    // Assuming the RPC function is named 'increment_used_holidays' and its parameter names match the DB schema.
    return from(this.supabaseSvc.supabase.rpc('increment_used_holidays', { emp_id: id, days_count: days }));
  }

  /** Update local user state from a full employee object */
  updateUserState(emp: Employee) {
    const current = this._currentUser.value;
    if (current && String(current.id).trim().toUpperCase() === String(emp.id).trim().toUpperCase()) {
      const updated = { ...current, ...emp };
      this._currentUser.next(updated);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }
  }
}
