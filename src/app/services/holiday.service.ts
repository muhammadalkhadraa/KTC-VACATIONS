import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HolidayRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class HolidayService {
  // Pointing directly to our new local .NET backend!
  private apiUrl = 'http://localhost:5000/api/holiday';

  constructor(private http: HttpClient) { }

  getForEmployee(empId: string): Observable<HolidayRequest[]> {
     return this.http.get<HolidayRequest[]>(`${this.apiUrl}/${empId}`);
  }

  submit(req: Partial<HolidayRequest>): Observable<HolidayRequest> {
     const payload = {
       empId: req.empId,
       emp_name: req.emp_name || req.empId,
       startDate: req.startDate || new Date().toISOString(),
       end_date: req.end_date || new Date().toISOString(),
       days: req.days || 1,
       reason: req.reason || '',
       status: 'pending',
       manager_status: 'pending',
       manager_id: '',
       gm_status: 'pending',
       gm_id: '',
       submittedAt: new Date().toISOString()
     };
     return this.http.post<HolidayRequest>(this.apiUrl, payload);
  }

  getAll(): Observable<HolidayRequest[]> {
     return this.http.get<HolidayRequest[]>(this.apiUrl);
  }

  getPending(role?: string): Observable<HolidayRequest[]> {
     return this.http.get<HolidayRequest[]>(`${this.apiUrl}/pending?role=${role}`);
  }

  approve(id: number, approverId: string, approverRole: string): Observable<HolidayRequest> {
     return this.http.post<HolidayRequest>(`${this.apiUrl}/approve/${id}`, { approverId, approverRole });
  }

  reject(id: number, approverId: string, approverRole: string): Observable<HolidayRequest> {
     return this.http.post<HolidayRequest>(`${this.apiUrl}/reject/${id}`, { approverId, approverRole });
  }
}
