import { Injectable } from '@angular/core';
import { catchError, from, map, Observable, of, tap } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { HolidayRequest } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HolidayService {
  private cache = new Map<string, HolidayRequest[]>();

  constructor(private supabaseSvc: SupabaseService) {}

  private readonly SELECT_ALL = 'RequestId:requestId, EmpId:empId, EmpName:empName, StartDate:startDate, EndDate:endDate, Days:days, Reason:reason, Status:status, ManagerStatus:managerStatus, ManagerId:managerId, GmStatus:gmStatus, GmId:gmId, SubmittedAt:submittedAt';

  getForEmployee(empId: string): Observable<HolidayRequest[]> {
    if (!empId) return of([]);
    const id = String(empId).trim().toUpperCase();
    const cached = this.cache.get(id);

    return from(
      this.supabaseSvc.supabase.from('holiday_requests').select(this.SELECT_ALL).eq('EmpId', id).order('SubmittedAt', { ascending: false })
    ).pipe(
      map(({ data }) => {
        const reqs = (data as unknown as HolidayRequest[]) || [];
        if (!reqs.length && cached) return cached;
        this.cache.set(id, reqs);
        return reqs;
      }),
      catchError(() => of(this.cache.get(id) || []))
    );
  }

  submit(req: Partial<HolidayRequest>): Observable<HolidayRequest> {
    const newReq = {
      EmpId: req.empId,
      EmpName: req.empName,
      StartDate: req.startDate,
      EndDate: req.endDate,
      Days: req.days,
      Reason: req.reason,
      SubmittedAt: new Date().toISOString(),
      Status: 'pending',
      ManagerStatus: 'pending',
      GmStatus: 'pending'
    };
    return from(this.supabaseSvc.supabase.from('holiday_requests').insert([newReq]).select(this.SELECT_ALL).single()).pipe(
      map(({ data }) => {
        const created = data as unknown as HolidayRequest;
        const id = created.empId.toUpperCase();
        const existing = this.cache.get(id) ?? [];
        this.cache.set(id, [...existing, created]);
        return created;
      })
    );
  }

  // admin helpers
  getAll(): Observable<HolidayRequest[]> {
    return from(this.supabaseSvc.supabase.from('holiday_requests').select(this.SELECT_ALL).order('SubmittedAt', { ascending: false })).pipe(
      map(({ data }) => (data as unknown as HolidayRequest[]) || [])
    );
  }

  getPending(role?: string): Observable<HolidayRequest[]> {
    let query = this.supabaseSvc.supabase.from('holiday_requests').select(this.SELECT_ALL).eq('Status', 'pending');

    if (role === 'manager') {
      query = query.eq('ManagerStatus', 'pending');
    } else if (role === 'general manager') {
      query = query.eq('ManagerStatus', 'approved').eq('GmStatus', 'pending');
    }

    return from(query.order('SubmittedAt', { ascending: false })).pipe(
      map(({ data }) => (data as unknown as HolidayRequest[]) || [])
    );
  }

  approve(id: number, approverId: string, approverRole: string): Observable<HolidayRequest> {
    const update: any = {};
    if (approverRole === 'manager') {
      update.ManagerStatus = 'approved';
      update.ManagerId = approverId;
    } else if (approverRole === 'general manager') {
      update.GmStatus = 'approved';
      update.GmId = approverId;
      update.Status = 'approved'; 
    }

    return from(this.supabaseSvc.supabase.from('holiday_requests').update(update).eq('RequestId', id).select(this.SELECT_ALL).single()).pipe(
      map(({ data }) => data as unknown as HolidayRequest)
    );
  }

  reject(id: number, approverId: string, approverRole: string): Observable<HolidayRequest> {
    const update: any = { Status: 'rejected' };
    if (approverRole === 'manager') {
      update.ManagerStatus = 'rejected';
      update.ManagerId = approverId;
    } else if (approverRole === 'general manager') {
      update.GmStatus = 'rejected';
      update.GmId = approverId;
    }

    return from(this.supabaseSvc.supabase.from('holiday_requests').update(update).eq('RequestId', id).select(this.SELECT_ALL).single()).pipe(
      map(({ data }) => data as unknown as HolidayRequest)
    );
  }
}
