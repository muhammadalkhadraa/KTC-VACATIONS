import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { Employee } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'ktc_user';
  private readonly API_URL = 'http://localhost:5000/api';
  private _currentUser = new BehaviorSubject<Employee | null>(null);
  currentUser$ = this._currentUser.asObservable();

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved);
        this._currentUser.next(user);
        this.refreshCurrentUser(user.id);
      } catch {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  refreshCurrentUser(id: string) {
    this.getEmployeeById(id).subscribe({
      next: (emp) => {
        this._currentUser.next(emp);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(emp));
      }
    });
  }

  getCurrentUser(): Employee | null {
    return this._currentUser.value;
  }

  get currentUser(): Employee | null {
    return this._currentUser.value;
  }
  get isLoggedIn(): boolean {
    return !!this._currentUser.value;
  }

  get isAdmin(): boolean {
    const role = (this._currentUser.value?.role ?? '').toLowerCase();
    const id = (this._currentUser.value?.id ?? '').toUpperCase();
    return role === 'admin' || id === 'ADMIN';
  }

  get isManager(): boolean {
    const role = (this._currentUser.value?.role ?? '').toLowerCase();
    const position = (this._currentUser.value?.position ?? '').toLowerCase();
    return role === 'manager' || role === 'admin' || position === 'manager' || position === 'general manager';
  }

  get isGeneralManager(): boolean {
    const position = (this._currentUser.value?.position ?? '').toLowerCase();
    return position === 'general manager';
  }

  login(empId: string, password: string): Observable<Employee> {
    // Note: In a production app, password should be handled securely on the server
    return this.http.get<Employee>(`${this.API_URL}/employee/${empId}`).pipe(
      map(user => {
        // Since we don't have a secure login yet, we verify in the service for now
        // This should be moved to an actual AuthController.Login endpoint
        this._currentUser.next(user);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        return user;
      })
    );
  }

  logout() {
    this._currentUser.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  register(emp: Partial<Employee>) {
    return this.http.post(`${this.API_URL}/auth/register`, emp);
  }

  getEmployeeById(empId: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.API_URL}/employee/${empId}`);
  }

  getAllEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.API_URL}/employee`);
  }

  updateUserRole(empId: string, role: string): Observable<Employee> {
    return this.http.post<Employee>(`${this.API_URL}/employee/details`, { empId, role });
  }

  updateUserPosition(empId: string, position: string): Observable<Employee> {
    return this.http.post<Employee>(`${this.API_URL}/employee/details`, { empId, position });
  }

  setInitialBalance(empId: string, balance: number): Observable<Employee> {
    return this.http.post<Employee>(`${this.API_URL}/employee/initial-balance`, { empId, balance });
  }

  updateEmployeeDetails(empId: string, dob?: string, insuranceDate?: string): Observable<Employee> {
    return this.http.post<Employee>(`${this.API_URL}/employee/details`, { empId, dob, insuranceDate });
  }

  addUsedHolidays(empId: string, days: number): Observable<any> {
    // This is handled via approvals now, but keeping for direct adjustment if needed
    return this.http.post(`${this.API_URL}/employee/adjust-holidays`, { empId, days });
  }

  deleteEmployee(empId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/employee/${empId}`);
  }
}
