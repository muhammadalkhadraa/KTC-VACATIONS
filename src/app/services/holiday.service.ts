import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { HolidayRequest } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private api = `${environment.apiUrl}/holiday`;
  private cache = new Map<string, HolidayRequest[]>();

  constructor(private http: HttpClient) {}

  getForEmployee(empId: string): Observable<HolidayRequest[]> {
    if (!empId) return of([]);
    const id = String(empId).trim().toUpperCase();
    const cached = this.cache.get(id);
    const request$ = this.http.get<HolidayRequest[]>(`${this.api}/${id}`);

    return request$.pipe(
      map((reqs: HolidayRequest[]) => {
        // If backend returned nothing but we already have cached results, keep showing them.
        if (!reqs.length && cached) {
          return cached;
        }
        // Otherwise use and cache the fresh response.
        this.cache.set(id, reqs);
        return reqs;
      }),
      catchError(() => {
        const fallback = this.cache.get(id) ?? [];
        return of(fallback);
      })
    );
  }

  submit(req: Partial<HolidayRequest>): Observable<HolidayRequest> {
    return this.http.post<HolidayRequest>(this.api, req).pipe(
      tap(created => {
        const id = created.empId.toUpperCase();
        const existing = this.cache.get(id) ?? [];
        this.cache.set(id, [...existing, created]);
      }),
      catchError(err => {
        // keep cache unchanged on error
        throw err;
      })
    );
  }

  // admin helpers
  getAll(): Observable<HolidayRequest[]> {
    return this.http.get<HolidayRequest[]>(this.api);
  }

  getPending(role?: string): Observable<HolidayRequest[]> {
    const query = role ? `?role=${encodeURIComponent(role)}` : '';
    return this.http.get<HolidayRequest[]>(`${this.api}/pending${query}`);
  }

  approve(id: number, approverId: string, approverRole: string): Observable<HolidayRequest> {
    return this.http.post<HolidayRequest>(`${this.api}/approve/${id}`, { approverId, approverRole });
  }

  reject(id: number, approverId: string, approverRole: string): Observable<HolidayRequest> {
    return this.http.post<HolidayRequest>(`${this.api}/reject/${id}`, { approverId, approverRole });
  }
}
