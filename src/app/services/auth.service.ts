import { Injectable } from '@angular/core';
import { BehaviorSubject, from, map, Observable, of } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Employee } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'ktc_user';
  private _currentUser = new BehaviorSubject<Employee | null>(null);
  currentUser$ = this._currentUser.asObservable();

  constructor(private supabaseSvc: SupabaseService) {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this._currentUser.next(JSON.parse(saved));
      } catch {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  getCurrentUser(): Employee | null {
    return this._currentUser.value;
  }

  login(empId: string, password: string): Observable<Employee> {
    return from(
      this.supabaseSvc.supabase
        .from('employee')
        .select('id, name, department, position, joined, total_holidays:totalHolidays, used_holidays:usedHolidays, password, role')
        .eq('id', empId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error || new Error('User not found');
        const user = data as any;
        if (user.password !== password) throw new Error('Invalid password');
        
        const emp: Employee = {
          id: user.id,
          name: user.name,
          department: user.department,
          position: user.position,
          joined: user.joined,
          totalHolidays: user.totalHolidays,
          usedHolidays: user.usedHolidays,
          password: '',
          role: user.role
        };
        
        this._currentUser.next(emp);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(emp));
        return emp;
      })
    );
  }

  logout() {
    this._currentUser.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  register(emp: Partial<Employee>) {
    const newEmp = {
      id: emp.id,
      name: emp.name,
      department: emp.department,
      position: emp.position,
      joined: new Date().toISOString().split('T')[0],
      total_holidays: 21,
      used_holidays: 0,
      password: emp.password,
      role: 'employee'
    };
    return from(this.supabaseSvc.supabase.from('employee').insert([newEmp]));
  }

  getEmployeeById(empId: string) {
    return from(
      this.supabaseSvc.supabase
        .from('employee')
        .select('id, name, department, position, joined, total_holidays:totalHolidays, used_holidays:usedHolidays, password, role')
        .eq('id', empId)
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
        .select('id, name, department, position, joined, total_holidays:totalHolidays, used_holidays:usedHolidays, password, role')
    ).pipe(
      map(({ data }) => (data || []) as unknown as Employee[])
    );
  }

  updateUserRole(empId: string, role: string) {
    return from(this.supabaseSvc.supabase.from('employee').update({ role }).eq('id', empId).select('id, role').single()).pipe(
      map(({ data }) => data as unknown as Employee)
    );
  }

  updateUserPosition(empId: string, position: string) {
    return from(this.supabaseSvc.supabase.from('employee').update({ position }).eq('id', empId).select('id, position').single()).pipe(
      map(({ data }) => data as unknown as Employee)
    );
  }

  /** Update used holidays after an approval */
  addUsedHolidays(empId: string, days: number) {
    const id = empId.trim().toUpperCase();
    return from(this.supabaseSvc.supabase.rpc('increment_used_holidays', { emp_id: id, days_count: days }));
  }
}
