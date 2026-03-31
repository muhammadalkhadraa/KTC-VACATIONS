import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Employee } from '../models/models';
import { environment } from '../../environments/environment';

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

  /** True if user is a system administrator */
  get isSystemAdmin(): boolean {
    return this._currentUser.value?.role?.toLowerCase() === 'admin';
  }

  /** True if user can approve requests or manage the system */
  get hasApprovalRights(): boolean {
    return this.isManager || this.isGeneralManager || this.isSystemAdmin;
  }

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
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
    return this.http.post<{id: string, name: string, position: string, role: string}>(
        `${this.apiUrl}/auth/login`, { id, password })
      .pipe(
        tap(res => {
          const normalizedPosition = (res.position ?? '').toString().trim().toLowerCase();
          const emp: Employee = {
            id: String(res.id).trim().toUpperCase(),
            name: res.name,
            department: '',
            position: normalizedPosition,
            joined: '',
            totalHolidays: 0,
            usedHolidays: 0,
            password: '',
            role: res.role ? res.role.toString().trim().toLowerCase() : 'employee'
          };
          this._currentUser.next(emp);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(emp));
        }),
        catchError(() => of(null))
      );
  }

  logout(): void {
    this._currentUser.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  register(data: {id: string, password: string, name: string, department: string, position: string}) {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  getEmployeeById(id: string) {
    return this.http.get<Employee>(`${this.apiUrl}/profile/${id}`);
  }

  /** Retrieve the list of users (admin feature). */
  getAllEmployees() {
    return this.http.get<Employee[]>(`${this.apiUrl}/admin/users`);
  }

  updateUserRole(empId: string, role: string) {
    return this.http.put<Employee>(`${this.apiUrl}/admin/users/${encodeURIComponent(empId)}/role`, { role });
  }

  updateUserPosition(empId: string, position: string) {
    return this.http.put<Employee>(`${this.apiUrl}/admin/users/${encodeURIComponent(empId)}/position`, { position });
  }

  /** Update used holidays after an approval */
  addUsedHolidays(empId: string, days: number) {
    return this.http.post(`${this.apiUrl}/attendance/update-used`, { empId, days });
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
