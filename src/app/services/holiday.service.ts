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
     return this.http.post<HolidayRequest>(this.apiUrl, req);
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
